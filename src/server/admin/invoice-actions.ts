"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "../auth";
import { db } from "../db";
import type { ActionState } from "./actions";

const issuedSchema = z.object({
  orderId: z.string().min(1),
  dianInvoiceNumber: z
    .string()
    .trim()
    .min(1, "Ingresa el número de la factura electrónica.")
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "El número de factura solo lleva letras, números y guiones (ej. FE-1024)."),
  // El CUFE es un hash SHA-384 en hexadecimal (96 caracteres).
  cufe: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s/g, "").toLowerCase())
    .pipe(z.string().regex(/^[0-9a-f]{96}$/, "El CUFE debe tener 96 caracteres (letras a-f y números).")),
});

/** Registra la factura electrónica real (expedida en el software autorizado por la DIAN) y marca el pedido como emitido. */
export async function markInvoiceIssuedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = issuedSchema.safeParse({
    orderId: formData.get("orderId"),
    dianInvoiceNumber: formData.get("dianInvoiceNumber"),
    cufe: formData.get("cufe"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { orderId, dianInvoiceNumber, cufe } = parsed.data;

  const order = await db.order.findUnique({ where: { id: orderId }, select: { orderNumber: true, paymentStatus: true, invoiceIssuedAt: true } });
  if (!order) return { error: "El pedido ya no existe." };
  if (order.paymentStatus !== "APPROVED") return { error: "Solo se facturan pedidos pagados." };

  await db.order.update({
    where: { id: orderId },
    data: {
      invoiceStatus: "EMITIDA",
      dianInvoiceNumber: dianInvoiceNumber.toUpperCase(),
      cufe,
      // Si se corrige el número o el CUFE, se conserva la fecha de emisión original.
      invoiceIssuedAt: order.invoiceIssuedAt ?? new Date(),
      events: { create: { type: "NOTE_ADDED", actor: "admin", metadata: { invoice: "emitida", dianInvoiceNumber } } },
    },
  });
  revalidatePath("/admin/facturas");
  revalidatePath("/admin");
  // El pedido sale de "Pendientes": se lleva al admin a "Emitidas" con el aviso de confirmación.
  redirect(`/admin/facturas?filtro=emitidas&registrada=${encodeURIComponent(order.orderNumber)}`);
}
