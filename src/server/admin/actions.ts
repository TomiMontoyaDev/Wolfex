"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FulfillmentStatus, OrderEventType, OrderStatus } from "@/generated/prisma/enums";
import {
  checkAdminPassword,
  clearFailedLogins,
  endAdminSession,
  loginRateLimited,
  registerFailedLogin,
  requireAdmin,
  startAdminSession,
} from "../auth";
import { db } from "../db";

export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

// ───────────── Sesión ─────────────

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (loginRateLimited(ip)) return { error: "Demasiados intentos. Espera 15 minutos." };

  const password = String(formData.get("password") ?? "");
  let valid = false;
  try {
    valid = checkAdminPassword(password);
  } catch (error) {
    console.error("[admin] login", error);
    return { error: "El acceso al panel no está configurado en el servidor." };
  }
  if (!valid) {
    registerFailedLogin(ip);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { error: "Contraseña incorrecta." };
  }
  clearFailedLogins(ip);
  await startAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

// ───────────── Pedidos ─────────────

/** Acciones de flujo permitidas desde el panel y su efecto sobre los estados. */
const ORDER_ACTIONS = {
  PROCESSING: { status: "PROCESSING", fulfillment: "PROCESSING", event: "ORDER_PROCESSING", requiresPaid: true },
  READY_TO_SHIP: { status: "PROCESSING", fulfillment: "READY_TO_SHIP", event: "ORDER_READY_TO_SHIP", requiresPaid: true },
  SHIPPED: { status: "SHIPPED", fulfillment: "SHIPPED", event: "ORDER_SHIPPED", requiresPaid: true },
  DELIVERED: { status: "DELIVERED", fulfillment: "DELIVERED", event: "ORDER_DELIVERED", requiresPaid: true },
  CANCELLED: { status: "CANCELLED", fulfillment: "CANCELLED", event: "ORDER_CANCELLED", requiresPaid: false },
} as const satisfies Record<string, { status: OrderStatus; fulfillment: FulfillmentStatus; event: OrderEventType; requiresPaid: boolean }>;

export type OrderAction = keyof typeof ORDER_ACTIONS;
const TERMINAL: OrderStatus[] = ["DELIVERED", "CANCELLED", "REFUNDED"];

const statusSchema = z.object({
  orderId: z.string().min(1).max(40),
  action: z.enum(Object.keys(ORDER_ACTIONS) as [OrderAction, ...OrderAction[]]),
  note: z.string().max(500).optional(),
});

export async function updateOrderStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = statusSchema.safeParse({
    orderId: formData.get("orderId"),
    action: formData.get("action"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: "Acción inválida." };
  const { orderId, action, note } = parsed.data;
  const config = ORDER_ACTIONS[action];

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Pedido no encontrado." };
  if (TERMINAL.includes(order.status)) return { error: `El pedido está ${order.status.toLowerCase()} y no admite cambios.` };
  if (config.requiresPaid && order.paymentStatus !== "APPROVED") return { error: "El pago todavía no está aprobado." };

  const now = new Date();
  await db.order.update({
    where: { id: orderId },
    data: {
      status: config.status,
      fulfillmentStatus: config.fulfillment,
      ...(action === "SHIPPED" && { shippedAt: now }),
      ...(action === "DELIVERED" && { deliveredAt: now, shippedAt: order.shippedAt ?? now }),
      ...(action === "CANCELLED" && { cancelledAt: now }),
      events: {
        create: {
          type: config.event,
          actor: "admin",
          message:
            action === "CANCELLED" && order.paymentStatus === "APPROVED"
              ? `${note ? `${note} · ` : ""}El pago estaba aprobado: realizar el reembolso desde Mercado Pago.`
              : note,
          metadata: { from: { status: order.status, fulfillment: order.fulfillmentStatus } },
        },
      },
    },
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Estado actualizado." };
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim() || null);

const shippingSchema = z.object({
  orderId: z.string().min(1).max(40),
  carrier: optionalText(80),
  trackingNumber: optionalText(80),
  trackingUrl: optionalText(500).refine((value) => !value || /^https:\/\//i.test(value), "La URL de seguimiento debe empezar por https://"),
  shippingCostActual: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value.replace(/[.\s$]/g, ""))))
    .refine((value) => value === null || (Number.isInteger(value) && value >= 0), "Costo de envío inválido."),
});

export async function updateShippingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = shippingSchema.safeParse(Object.fromEntries(["orderId", "carrier", "trackingNumber", "trackingUrl", "shippingCostActual"].map((key) => [key, String(formData.get(key) ?? "")])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { orderId, ...data } = parsed.data;

  await db.order.update({
    where: { id: orderId },
    data: { ...data, events: { create: { type: "TRACKING_UPDATED", actor: "admin", metadata: data } } },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Datos de envío guardados." };
}

// ───────────── Eliminar ─────────────

const idsSchema = z.array(z.string().min(1).max(40)).min(1, "Selecciona al menos un pedido.").max(200);

/**
 * Borra pedidos definitivamente (con sus ítems, pagos y eventos).
 * No toca Mercado Pago: si un pedido estaba pagado, el dinero sigue allá.
 */
export async function deleteOrdersAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = idsSchema.safeParse(formData.getAll("ids").map(String));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Selección inválida." };
  const { count } = await db.order.deleteMany({ where: { id: { in: parsed.data } } });
  revalidatePath("/admin", "layout");
  if (formData.get("redirectTo") === "list") redirect("/admin/orders?eliminados=" + count);
  return { ok: true, message: `${count} ${count === 1 ? "pedido eliminado" : "pedidos eliminados"}.` };
}

/** Borra un cliente con todos sus pedidos y direcciones. */
export async function deleteCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) return { error: "Cliente inválido." };
  await db.$transaction([
    db.order.deleteMany({ where: { customerId } }),
    db.customer.deleteMany({ where: { id: customerId } }),
  ]);
  revalidatePath("/admin", "layout");
  redirect("/admin/customers?eliminado=1");
}
