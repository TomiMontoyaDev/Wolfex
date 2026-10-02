import { NextResponse } from "next/server";
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";
import { payments } from "@/lib/mercadopago";
import { findOrderByInvoice, updateOrder, type OrderStatus } from "@/lib/orders";

const STATUS_MAP: Record<string, OrderStatus> = {
  approved: "PAID",
  rejected: "FAILED",
  cancelled: "CANCELLED",
  refunded: "CANCELLED",
  charged_back: "CANCELLED",
};

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const paymentId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  // Solo nos interesan las notificaciones de pagos; el resto se acusa con 200 para que no se reintenten.
  if (type !== "payment" || !paymentId) return NextResponse.json({ ok: true, ignored: true });

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId: url.searchParams.get("data.id") ?? paymentId,
        secret,
        toleranceSeconds: 300,
      });
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        console.warn("[mercadopago] firma inválida", error.reason, error.requestId);
        return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
      }
      throw error;
    }
  }

  try {
    // Nunca confiamos en el cuerpo de la notificación: consultamos el pago directamente a Mercado Pago.
    const payment = await payments().get({ id: paymentId });
    const order = findOrderByInvoice(payment.external_reference ?? "");
    if (!order) return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
    if (order.status === "PAID") return NextResponse.json({ ok: true, duplicate: true });

    const amountMatches = Number(payment.transaction_amount) === order.total;
    const currencyMatches = payment.currency_id?.toUpperCase() === order.currency;
    if (!amountMatches || !currencyMatches) {
      console.warn("[mercadopago] monto o moneda no coinciden", { paymentId, invoice: order.invoice });
      return NextResponse.json({ error: "Pago inválido." }, { status: 400 });
    }

    const status = STATUS_MAP[payment.status ?? ""] ?? "PENDING";
    updateOrder(order.id, { status, mercadopago: { paymentId, status: payment.status } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mercadopago] webhook error", error);
    return NextResponse.json({ error: "No fue posible procesar la notificación." }, { status: 500 });
  }
}
