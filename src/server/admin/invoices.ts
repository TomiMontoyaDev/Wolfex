import "server-only";
import { formatDateTime, paymentMethodLabel } from "@/components/admin/format";
import { hasFreeShipping } from "@/config/shipping";
import type { InvoiceStatus, Prisma } from "@/generated/prisma/client";
import { formatPrice } from "@/lib/utils";
import { db } from "../db";

/**
 * Facturas: solicitudes de factura electrónica y comprobantes de venta.
 * Solo pedidos PAGADOS: una venta sin pago no se factura ni tiene comprobante.
 */

export const INVOICE_FILTERS = {
  pendientes: { label: "Pendientes de factura", where: { invoiceStatus: "PENDIENTE" } },
  emitidas: { label: "Emitidas", where: { invoiceStatus: "EMITIDA" } },
  todos: { label: "Todos", where: {} },
} as const satisfies Record<string, { label: string; where: { invoiceStatus?: InvoiceStatus } }>;

export type InvoiceFilter = keyof typeof INVOICE_FILTERS;

const invoiceOrderSelect = {
  id: true,
  orderNumber: true,
  createdAt: true,
  paidAt: true,
  subtotal: true,
  shippingCost: true,
  discount: true,
  total: true,
  paymentId: true,
  paymentMethod: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  shippingAddress: true,
  shippingComplement: true,
  shippingCity: true,
  shippingDepartment: true,
  requiresInvoice: true,
  invoiceStatus: true,
  dianInvoiceNumber: true,
  cufe: true,
  invoiceIssuedAt: true,
  receiptNumber: true,
  invoiceRequest: true,
  items: { select: { id: true, productName: true, sku: true, variant: true, quantity: true, unitPrice: true, totalPrice: true }, orderBy: { productName: "asc" } },
} satisfies Prisma.OrderSelect;

export type InvoiceOrder = Prisma.OrderGetPayload<{ select: typeof invoiceOrderSelect }>;

const PAID = { paymentStatus: "APPROVED" } as const;

export async function listInvoiceOrders(filter: InvoiceFilter) {
  const [orders, pending, issued, all] = await Promise.all([
    db.order.findMany({
      where: { ...PAID, ...INVOICE_FILTERS[filter].where },
      // Pendientes: primero los más antiguos (los que llevan más tiempo esperando).
      orderBy: { createdAt: filter === "pendientes" ? "asc" : "desc" },
      take: 100,
      select: invoiceOrderSelect,
    }),
    db.order.count({ where: { ...PAID, invoiceStatus: "PENDIENTE" } }),
    db.order.count({ where: { ...PAID, invoiceStatus: "EMITIDA" } }),
    db.order.count({ where: PAID }),
  ]);
  return { orders, counts: { pendientes: pending, emitidas: issued, todos: all } };
}

export async function countPendingInvoices() {
  return db.order.count({ where: { ...PAID, invoiceStatus: "PENDIENTE" } });
}

/**
 * Pedidos pagados para imprimir, en el orden pedido. Asigna el consecutivo WFX-C-xxxxxx a los que aún
 * no lo tienen (la secuencia de Postgres nunca repite números, aunque dos impresiones ocurran a la vez).
 */
export async function getReceiptOrders(orderNumbers: string[]) {
  const unique = [...new Set(orderNumbers)].slice(0, 100);
  if (!unique.length) return [];
  await db.$executeRaw`
    WITH pending AS (
      SELECT id FROM "Order"
      WHERE "orderNumber" = ANY(${unique}) AND "paymentStatus" = 'APPROVED' AND "receiptNumber" IS NULL
      ORDER BY "createdAt"
      FOR UPDATE
    )
    UPDATE "Order" o
    SET "receiptNumber" = 'WFX-C-' || lpad(nextval('order_receipt_number_seq')::text, 6, '0')
    FROM pending
    WHERE o.id = pending.id`;
  const orders = await db.order.findMany({ where: { orderNumber: { in: unique }, ...PAID }, select: invoiceOrderSelect });
  return unique.flatMap((number) => orders.filter((order) => order.orderNumber === number));
}

/** Cliente a facturar: los datos de facturación si los pidió; si no, los de envío. */
export function billingParty(order: InvoiceOrder) {
  const request = order.invoiceRequest;
  if (request) {
    return {
      name: request.legalName,
      document: `${request.docType === "PASAPORTE" ? "Pasaporte" : request.docType} ${request.docNumber}${request.dv ? `-${request.dv}` : ""}`,
      personType: request.personType === "JURIDICA" ? "Persona jurídica" : "Persona natural",
      email: request.email,
      phone: request.phone,
      address: `${request.address}, ${request.city}, ${request.department}`,
    };
  }
  return {
    name: order.customerName,
    document: null,
    personType: null,
    email: order.customerEmail,
    phone: order.customerPhone,
    address: [order.shippingAddress, order.shippingComplement, order.shippingCity, order.shippingDepartment].filter(Boolean).join(", "),
  };
}

/** Valor del envío para mostrar: el pedido no cobra envío en línea (gratis o se cobra aparte). */
export function shippingLabel(order: Pick<InvoiceOrder, "shippingCost" | "subtotal" | "discount" | "shippingCity">) {
  if (order.shippingCost > 0) return formatPrice(order.shippingCost);
  return hasFreeShipping(order.subtotal - order.discount, order.shippingCity) ? "Gratis" : "Se cobra aparte";
}

/** Bloque de texto para pegar en el software de facturación electrónica. */
export function invoiceCopyText(order: InvoiceOrder) {
  const party = billingParty(order);
  const lines = [
    `PEDIDO ${order.orderNumber} · ${formatDateTime(order.paidAt ?? order.createdAt)}`,
    "",
    "CLIENTE",
    `Nombre / razón social: ${party.name}`,
    ...(party.personType ? [`Tipo de persona: ${party.personType}`] : []),
    ...(party.document ? [`Documento: ${party.document}`] : []),
    `Correo: ${party.email}`,
    `Teléfono: ${party.phone ?? "—"}`,
    `Dirección: ${party.address}`,
    "",
    "PRODUCTOS",
    ...order.items.map((item) => `${item.quantity} × ${item.productName}${item.variant ? ` (${item.variant})` : ""} [${item.sku}] · ${formatPrice(item.unitPrice)} c/u · ${formatPrice(item.totalPrice)}`),
    "",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Envío: ${shippingLabel(order)}`,
    ...(order.discount ? [`Descuento combo: -${formatPrice(order.discount)}`] : []),
    `TOTAL: ${formatPrice(order.total)}`,
    `Medio de pago: Mercado Pago${order.paymentMethod ? ` · ${paymentMethodLabel(order.paymentMethod)}` : ""}${order.paymentId ? ` · ID ${order.paymentId}` : ""}`,
  ];
  return lines.join("\n");
}
