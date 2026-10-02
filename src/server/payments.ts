import "server-only";
import type { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";
import type { OrderEventType, PaymentStatus, Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { mpPayments } from "./mercadopago";

const STATUS_MAP: Record<string, PaymentStatus> = {
  approved: "APPROVED",
  authorized: "PENDING",
  pending: "PENDING",
  in_process: "PENDING",
  in_mediation: "PENDING",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

/**
 * Copia filtrada de la respuesta de Mercado Pago para auditoría.
 * Excluye a propósito `card`, `payer`, `additional_info` y cualquier dato personal o de tarjeta.
 */
function sanitize(payment: PaymentResponse) {
  return {
    id: payment.id,
    status: payment.status,
    status_detail: payment.status_detail,
    payment_method_id: payment.payment_method_id,
    payment_type_id: payment.payment_type_id,
    transaction_amount: payment.transaction_amount,
    currency_id: payment.currency_id,
    installments: payment.installments,
    external_reference: payment.external_reference,
    order: payment.order ?? null,
    date_created: payment.date_created,
    date_approved: payment.date_approved,
    date_last_updated: payment.date_last_updated,
    live_mode: payment.live_mode,
    fee_details: payment.fee_details ?? [],
    net_received_amount: payment.transaction_details?.net_received_amount ?? null,
    refunds: payment.refunds?.length ?? 0,
  } satisfies Prisma.InputJsonValue;
}

const toInt = (value: number | undefined | null) => (typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null);

export type ProcessResult =
  | { result: "processed"; status: PaymentStatus }
  | { result: "duplicate" | "order_not_found" | "mismatch" };

/**
 * Procesa un pago de Mercado Pago a partir de su id.
 * - Nunca confía en el cuerpo del webhook: consulta el pago directamente a la API.
 * - Idempotente: bloquea la fila de la orden (SELECT … FOR UPDATE) y no repite efectos
 *   si el estado del pago ya estaba registrado.
 */
export async function processMercadoPagoPayment(paymentId: string): Promise<ProcessResult> {
  const mp = await mpPayments().get({ id: paymentId });
  const providerPaymentId = String(mp.id ?? paymentId);
  const order = mp.external_reference ? await db.order.findUnique({ where: { externalReference: mp.external_reference } }) : null;
  if (!order) return { result: "order_not_found" };

  const status = STATUS_MAP[mp.status ?? ""] ?? "PENDING";
  const amount = toInt(mp.transaction_amount) ?? 0;
  const currency = (mp.currency_id ?? "").toUpperCase();
  // Solo las comisiones que paga WOLFEX (collector); las de financiación las paga el comprador.
  const sellerFees = mp.fee_details?.filter((fee) => fee.fee_payer !== "payer") ?? [];
  const feeAmount = sellerFees.length ? Math.round(sellerFees.reduce((sum, fee) => sum + (fee.amount ?? 0), 0)) : null;
  const raw = sanitize(mp);

  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${order.id} FOR UPDATE`;

    const existing = await tx.payment.findUnique({
      where: { provider_providerPaymentId: { provider: "MERCADOPAGO", providerPaymentId } },
    });
    if (existing && existing.providerStatus === (mp.status ?? null) && existing.providerStatusDetail === (mp.status_detail ?? null)) {
      return { result: "duplicate" } as const;
    }

    const paymentData = {
      providerOrderId: mp.order?.id ? String(mp.order.id) : order.mpPreferenceId,
      status,
      providerStatus: mp.status ?? null,
      providerStatusDetail: mp.status_detail ?? null,
      amount,
      currency,
      paymentMethod: mp.payment_method_id ?? null,
      paymentType: mp.payment_type_id ?? null,
      feeAmount,
      netAmount: toInt(mp.transaction_details?.net_received_amount),
      rawResponse: raw,
      approvedAt: mp.date_approved ? new Date(mp.date_approved) : null,
    };
    await tx.payment.upsert({
      where: { provider_providerPaymentId: { provider: "MERCADOPAGO", providerPaymentId } },
      create: { orderId: order.id, provider: "MERCADOPAGO", providerPaymentId, ...paymentData },
      update: paymentData,
    });

    const current = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
    const event = (type: OrderEventType, message?: string) =>
      tx.orderEvent.create({
        data: { orderId: order.id, type, actor: "webhook", message, metadata: { paymentId: providerPaymentId, status: mp.status, statusDetail: mp.status_detail, amount, currency } },
      });

    // Un pago cuyo monto o moneda no coincide jamás confirma la orden.
    if (amount !== current.total || currency !== current.currency) {
      await event("PAYMENT_MISMATCH", `Se esperaba ${current.total} ${current.currency} y llegó ${amount} ${currency}.`);
      return { result: "mismatch" } as const;
    }

    const alreadyPaid = current.paymentStatus === "APPROVED" && current.paymentId !== providerPaymentId;

    if (status === "APPROVED") {
      if (current.paymentStatus === "APPROVED") return { result: "duplicate" } as const;
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "APPROVED",
          status: current.status === "PENDING" ? "CONFIRMED" : current.status,
          paidAt: paymentData.approvedAt ?? new Date(),
          paymentId: providerPaymentId,
          paymentMethod: paymentData.paymentMethod,
          paymentFee: feeAmount,
        },
      });
      // Descuenta inventario solo de productos con stock controlado (stock no NULL).
      const items = await tx.orderItem.findMany({ where: { orderId: order.id, productId: { not: null } } });
      for (const item of items) {
        await tx.product.updateMany({ where: { id: item.productId!, stock: { not: null } }, data: { stock: { decrement: item.quantity } } });
      }
      await event("PAYMENT_APPROVED");
      if (current.status === "PENDING") await event("ORDER_CONFIRMED");
      else await event("NOTE_ADDED", `Pago aprobado sobre una orden en estado ${current.status}. Revisar manualmente.`);
    } else if (status === "REFUNDED") {
      if (current.paymentId === providerPaymentId && current.paymentStatus !== "REFUNDED") {
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "REFUNDED", status: "REFUNDED" } });
      }
      await event("REFUND_CREATED");
    } else if (!alreadyPaid && current.paymentStatus !== "APPROVED") {
      // PENDING / REJECTED / CANCELLED: solo afectan la orden si todavía no hay un pago aprobado.
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: status, paymentMethod: paymentData.paymentMethod } });
      await event(status === "PENDING" ? "PAYMENT_PENDING" : status === "REJECTED" ? "PAYMENT_REJECTED" : "PAYMENT_CANCELLED");
    } else {
      await event(status === "PENDING" ? "PAYMENT_PENDING" : status === "REJECTED" ? "PAYMENT_REJECTED" : "PAYMENT_CANCELLED", "Pago adicional; la orden ya tenía un pago aprobado.");
    }

    return { result: "processed", status } as const;
  });
}
