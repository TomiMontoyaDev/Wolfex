import type { FulfillmentStatus, OrderEventType, OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { formatPrice } from "@/lib/utils";

export const money = (value: number | null | undefined) => (value === null || value === undefined ? "—" : formatPrice(value));

const dateFormatter = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (value: Date | string | null | undefined) => (value ? dateFormatter.format(new Date(value)) : "—");
export const formatDateTime = (value: Date | string | null | undefined) => (value ? dateTimeFormatter.format(new Date(value)) : "—");
export const percent = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined ? "—" : `${(value * 100).toFixed(digits)}%`;

/** Variación relativa contra el período anterior; null si no hay base para comparar. */
export function delta(current: number, previous: number) {
  if (!previous) return null;
  return (current - previous) / previous;
}

export type Tone = "neutral" | "accent" | "good" | "warn" | "bad" | "muted";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pendiente", tone: "warn" },
  CONFIRMED: { label: "Confirmado", tone: "accent" },
  PROCESSING: { label: "Preparando", tone: "accent" },
  SHIPPED: { label: "Enviado", tone: "accent" },
  DELIVERED: { label: "Entregado", tone: "good" },
  CANCELLED: { label: "Cancelado", tone: "muted" },
  REFUNDED: { label: "Reembolsado", tone: "bad" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pendiente", tone: "warn" },
  APPROVED: { label: "Aprobado", tone: "good" },
  REJECTED: { label: "Rechazado", tone: "bad" },
  CANCELLED: { label: "Cancelado", tone: "muted" },
  REFUNDED: { label: "Reembolsado", tone: "bad" },
};

export const FULFILLMENT_STATUS: Record<FulfillmentStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Sin iniciar", tone: "muted" },
  PROCESSING: { label: "Preparando", tone: "accent" },
  READY_TO_SHIP: { label: "Listo para enviar", tone: "accent" },
  SHIPPED: { label: "Enviado", tone: "accent" },
  DELIVERED: { label: "Entregado", tone: "good" },
  CANCELLED: { label: "Cancelado", tone: "muted" },
};

export const EVENT_LABEL: Record<OrderEventType, string> = {
  ORDER_CREATED: "Pedido creado",
  CHECKOUT_CREATED: "Checkout de Mercado Pago creado",
  CHECKOUT_FAILED: "Error al crear el checkout",
  PAYMENT_PENDING: "Pago pendiente",
  PAYMENT_APPROVED: "Pago aprobado",
  PAYMENT_REJECTED: "Pago rechazado",
  PAYMENT_CANCELLED: "Pago cancelado",
  PAYMENT_MISMATCH: "Monto del pago no coincide",
  ORDER_CONFIRMED: "Pedido confirmado",
  ORDER_PROCESSING: "Preparando pedido",
  ORDER_READY_TO_SHIP: "Listo para enviar",
  ORDER_SHIPPED: "Pedido enviado",
  ORDER_DELIVERED: "Pedido entregado",
  ORDER_CANCELLED: "Pedido cancelado",
  REFUND_CREATED: "Reembolso registrado",
  TRACKING_UPDATED: "Datos de envío actualizados",
  NOTE_ADDED: "Nota",
  ORDER_EDITED: "Venta editada",
};

const PAYMENT_METHODS: Record<string, string> = {
  // Medios de las ventas registradas a mano (ver src/config/sales.ts).
  transferencia: "Transferencia bancaria",
  efectivo: "Efectivo",
  daviplata: "Daviplata",
  breb: "Llave Bre-B",
  mercadopago_link: "Link de Mercado Pago",
  datafono: "Datáfono / tarjeta",
  contraentrega: "Contraentrega",
  otro: "Otro",
  pse: "PSE",
  visa: "Visa",
  master: "Mastercard",
  amex: "American Express",
  diners: "Diners",
  efecty: "Efecty",
  nequi: "Nequi",
  bancolombia: "Bancolombia",
  account_money: "Dinero en cuenta MP",
  debvisa: "Visa Débito",
  debmaster: "Mastercard Débito",
};

export const paymentMethodLabel = (value: string | null | undefined) => (value ? (PAYMENT_METHODS[value] ?? value) : "—");
