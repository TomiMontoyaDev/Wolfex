"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { FulfillmentStatus, OrderStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "../auth";
import { db } from "../db";
import { generateOrderNumber } from "../orders";
import type { ActionState } from "./actions";

/**
 * Ventas registradas a mano (WhatsApp, transferencia, tienda…) y edición de cualquier venta.
 * Todo es editable: cliente, productos, precios, costos, descuento, envío, comisión y gastos operativos.
 */

const pesos = (label: string) =>
  z.coerce
    .number({ error: `${label} inválido.` })
    .int(`${label} debe ser un valor entero en pesos.`)
    .min(0, `${label} no puede ser negativo.`)
    .max(1_000_000_000, `${label} es demasiado alto.`);
const optionalPesos = (label: string) => z.union([z.literal(""), z.null(), pesos(label)]).transform((value) => (value === "" || value === null ? null : value));
const text = (max: number) => z.string().trim().max(max);

const saleSchema = z.object({
  id: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  customer: z.object({
    fullName: text(120).min(2, "Escribe el nombre del cliente."),
    phone: text(40),
    email: z.union([z.literal(""), z.email("Correo del cliente inválido.")]).transform((value) => value.toLowerCase()),
    department: text(80),
    city: text(80),
    address: text(240),
  }),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha de la venta inválida."),
  salesChannel: z.enum(["WEB", "WHATSAPP", "INSTAGRAM", "FACEBOOK", "TIKTOK", "PRESENCIAL", "REFERIDO", "OTRO"]),
  paymentMethod: text(40),
  paymentStatus: z.enum(["APPROVED", "PENDING", "REJECTED", "CANCELLED", "REFUNDED"]),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).nullable(),
        name: text(200).min(2, "Cada producto necesita un nombre."),
        sku: text(40),
        variant: text(80),
        quantity: z.coerce.number().int().min(1, "La cantidad mínima es 1.").max(999),
        unitPrice: pesos("El precio"),
        unitCost: optionalPesos("El costo"),
      }),
    )
    .min(1, "Agrega al menos un producto.")
    .max(50),
  discount: pesos("El descuento"),
  shippingCharged: pesos("El envío cobrado"),
  paymentFee: optionalPesos("La comisión"),
  shippingCostActual: optionalPesos("El costo real del envío"),
  expenses: z.array(z.object({ concept: text(80).min(1, "Cada gasto necesita un concepto."), amount: pesos("El gasto") })).max(30),
  notes: text(1000),
});

export type SalePayload = z.input<typeof saleSchema>;

const FULFILLMENT_BY_STATUS: Record<OrderStatus, FulfillmentStatus> = {
  PENDING: "PENDING",
  CONFIRMED: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "CANCELLED",
};

/** La fecha del formulario es hora de Colombia (UTC−5, sin horario de verano). */
const bogotaDate = (value: string) => new Date(`${value}:00-05:00`);

function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.split(/\s+/);
  return { firstName, lastName: rest.join(" ") || null };
}

/** Cantidades que descuentan inventario: solo cuentan las ventas pagadas. */
function stockQuantities(paid: boolean, items: Array<{ productId: string | null; quantity: number }>) {
  const map = new Map<string, number>();
  if (!paid) return map;
  for (const item of items) if (item.productId) map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
  return map;
}

export async function saveSaleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "No se pudo leer el formulario." };
  }
  const parsed = saleSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de la venta." };
  const sale = parsed.data;

  const subtotal = sale.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  if (sale.discount > subtotal) return { error: "El descuento no puede ser mayor que el subtotal." };
  const total = subtotal - sale.discount + sale.shippingCharged;
  const saleDate = bogotaDate(sale.saleDate);
  if (Number.isNaN(saleDate.getTime())) return { error: "Fecha de la venta inválida." };
  const paid = sale.paymentStatus === "APPROVED";

  // Productos del catálogo: el SKU sale de la base (los productos libres quedan como "MANUAL").
  const productIds = [...new Set(sale.items.flatMap((item) => (item.productId ? [item.productId] : [])))];
  const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, sku: true } });
  const skuById = new Map(products.map((product) => [product.id, product.sku]));
  const items = sale.items.map((item) => {
    const productId = item.productId && skuById.has(item.productId) ? item.productId : null;
    return {
      productId,
      productName: item.name,
      sku: productId ? skuById.get(productId)! : item.sku || "MANUAL",
      variant: item.variant || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      unitCost: item.unitCost,
      unitDiscount: 0,
    };
  });

  const snapshot = {
    customerName: sale.customer.fullName,
    customerEmail: sale.customer.email,
    customerPhone: sale.customer.phone || null,
    shippingCountry: "CO",
    shippingDepartment: sale.customer.department || null,
    shippingCity: sale.customer.city || null,
    shippingAddress: sale.customer.address,
    recipientName: sale.customer.fullName,
    recipientPhone: sale.customer.phone || null,
  };
  const status = sale.status as OrderStatus;
  const fulfillmentStatus = FULFILLMENT_BY_STATUS[status];
  const money = {
    subtotal,
    discount: sale.discount,
    shippingCost: sale.shippingCharged,
    tax: 0,
    total,
    paymentFee: sale.paymentFee,
    shippingCostActual: sale.shippingCostActual,
  };

  let orderId: string;
  try {
    if (sale.id) {
      // ───── Editar ─────
      const current = await db.order.findUnique({ where: { id: sale.id }, include: { items: true } });
      if (!current) return { error: "La venta ya no existe." };
      const manual = current.paymentProvider === "MANUAL";
      const stockDelta = new Map<string, number>();
      for (const [id, qty] of stockQuantities(current.paymentStatus === "APPROVED", current.items)) stockDelta.set(id, (stockDelta.get(id) ?? 0) + qty);
      for (const [id, qty] of stockQuantities(paid, items)) stockDelta.set(id, (stockDelta.get(id) ?? 0) - qty);

      await db.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { orderId: current.id } });
        await tx.orderExpense.deleteMany({ where: { orderId: current.id } });
        await tx.order.update({
          where: { id: current.id },
          data: {
            ...snapshot,
            ...money,
            salesChannel: sale.salesChannel,
            paymentMethod: sale.paymentMethod || null,
            paymentStatus: sale.paymentStatus,
            status,
            fulfillmentStatus,
            customerNotes: sale.notes || null,
            // Ventas manuales: la fecha del formulario manda. Ventas web: se conservan las fechas de Mercado Pago.
            ...(manual && { createdAt: saleDate }),
            paidAt: paid ? (manual ? saleDate : (current.paidAt ?? saleDate)) : null,
            shippedAt: ["SHIPPED", "DELIVERED"].includes(status) ? (current.shippedAt ?? saleDate) : null,
            deliveredAt: status === "DELIVERED" ? (current.deliveredAt ?? saleDate) : null,
            cancelledAt: ["CANCELLED", "REFUNDED"].includes(status) ? (current.cancelledAt ?? new Date()) : null,
            items: { create: items },
            expenses: { create: sale.expenses },
            events: {
              create: {
                type: "ORDER_EDITED",
                actor: "admin",
                message: `Total ${current.total} → ${total}`,
                metadata: { before: { total: current.total, items: current.items.length }, after: { total, items: items.length } },
              },
            },
          },
        });
        // Inventario: devuelve lo de antes y descuenta lo de ahora (solo productos con stock controlado).
        for (const [productId, delta] of stockDelta) {
          if (delta !== 0) await tx.product.updateMany({ where: { id: productId, stock: { not: null } }, data: { stock: { increment: delta } } });
        }
      });
      orderId = current.id;
    } else {
      // ───── Crear ─────
      let customerId = sale.customerId;
      if (customerId && !(await db.customer.findUnique({ where: { id: customerId }, select: { id: true } }))) customerId = undefined;
      if (!customerId && sale.customer.email) customerId = (await db.customer.findUnique({ where: { email: sale.customer.email }, select: { id: true } }))?.id;

      orderId = await db.$transaction(async (tx) => {
        if (!customerId) {
          const created = await tx.customer.create({
            data: { fullName: sale.customer.fullName, ...splitName(sale.customer.fullName), email: sale.customer.email || null, phone: sale.customer.phone || null },
          });
          customerId = created.id;
        }
        const address =
          sale.customer.address || sale.customer.city
            ? await tx.address.create({
                data: { customerId, department: sale.customer.department || null, city: sale.customer.city || null, address: sale.customer.address, recipientName: sale.customer.fullName, recipientPhone: sale.customer.phone || null },
              })
            : null;
        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(saleDate),
            externalReference: randomUUID(),
            customerId: customerId!,
            addressId: address?.id ?? null,
            paymentProvider: "MANUAL",
            salesChannel: sale.salesChannel,
            paymentMethod: sale.paymentMethod || null,
            paymentStatus: sale.paymentStatus,
            status,
            fulfillmentStatus,
            ...snapshot,
            ...money,
            currency: "COP",
            customerNotes: sale.notes || null,
            createdAt: saleDate,
            paidAt: paid ? saleDate : null,
            shippedAt: ["SHIPPED", "DELIVERED"].includes(status) ? saleDate : null,
            deliveredAt: status === "DELIVERED" ? saleDate : null,
            cancelledAt: ["CANCELLED", "REFUNDED"].includes(status) ? saleDate : null,
            items: { create: items },
            expenses: { create: sale.expenses },
            events: { create: { type: "ORDER_CREATED", actor: "admin", message: "Venta registrada a mano", metadata: { channel: sale.salesChannel, paymentMethod: sale.paymentMethod, total } } },
          },
        });
        for (const [productId, qty] of stockQuantities(paid, items)) {
          await tx.product.updateMany({ where: { id: productId, stock: { not: null } }, data: { stock: { decrement: qty } } });
        }
        return order.id;
      });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Ya existe un cliente con ese correo o el número de venta se repitió. Intenta de nuevo." };
    console.error("[admin] guardar venta", error);
    return { error: "No se pudo guardar la venta." };
  }

  revalidatePath("/admin", "layout");
  redirect(`/admin/orders/${orderId}?guardada=1`);
}

// ───────────── Clientes ─────────────

const customerSchema = z.object({
  id: z.string().min(1).optional(),
  fullName: text(120).min(2, "Escribe el nombre del cliente."),
  email: z.union([z.literal(""), z.email("Correo inválido.")]).transform((value) => value.toLowerCase()),
  phone: text(40),
  department: text(80),
  city: text(80),
  address: text(240),
  addressComplement: text(160),
});

/** Crear o editar un cliente (y su dirección principal). */
export async function saveCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const field = (key: string) => String(formData.get(key) ?? "");
  const parsed = customerSchema.safeParse({
    id: field("id") || undefined,
    fullName: field("fullName"),
    email: field("email"),
    phone: field("phone"),
    department: field("department"),
    city: field("city"),
    address: field("address"),
    addressComplement: field("addressComplement"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos del cliente." };
  const data = parsed.data;
  const base = { fullName: data.fullName, ...splitName(data.fullName), email: data.email || null, phone: data.phone || null };
  const addressData = { department: data.department || null, city: data.city || null, address: data.address, addressComplement: data.addressComplement || null, recipientName: data.fullName, recipientPhone: data.phone || null };
  const hasAddress = Boolean(data.address || data.city || data.department);

  let customerId: string;
  try {
    customerId = await db.$transaction(async (tx) => {
      const customer = data.id ? await tx.customer.update({ where: { id: data.id }, data: base }) : await tx.customer.create({ data: base });
      if (hasAddress) {
        const latest = await tx.address.findFirst({ where: { customerId: customer.id }, orderBy: { updatedAt: "desc" } });
        if (latest) await tx.address.update({ where: { id: latest.id }, data: addressData });
        else await tx.address.create({ data: { customerId: customer.id, ...addressData } });
      }
      return customer.id;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Ya existe otro cliente con ese correo." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { error: "El cliente ya no existe." };
    console.error("[admin] guardar cliente", error);
    return { error: "No se pudo guardar el cliente." };
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/customers/${customerId}?guardado=1`);
}
