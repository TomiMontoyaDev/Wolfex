import { NextResponse } from "next/server";
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";
import { processMercadoPagoPayment } from "@/server/payments";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const type = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const paymentId = String(body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

  // Solo procesamos pagos; el resto (merchant_order, etc.) se acusa con 200 para que no se reintente.
  if (type !== "payment" || !/^\d+$/.test(paymentId)) return NextResponse.json({ ok: true, ignored: true });

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId: url.searchParams.get("data.id") ?? paymentId,
        secret,
        toleranceSeconds: 600,
      });
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        console.warn("[mercadopago] firma inválida", error.reason, error.requestId);
        return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
      }
      throw error;
    }
  } else if (process.env.NODE_ENV === "production") {
    // Aun sin firma, el pago se consulta a la API de Mercado Pago, así que un aviso falso no puede aprobar nada.
    console.warn("[mercadopago] MERCADOPAGO_WEBHOOK_SECRET no configurado: no se verifica la firma.");
  }

  try {
    const outcome = await processMercadoPagoPayment(paymentId);
    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    // 500 → Mercado Pago reintenta la notificación más tarde.
    console.error("[mercadopago] webhook error", { paymentId, error });
    return NextResponse.json({ error: "No fue posible procesar la notificación." }, { status: 500 });
  }
}
