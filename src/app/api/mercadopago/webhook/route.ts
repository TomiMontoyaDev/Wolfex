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

  // La firma es una verificación adicional, no la garantía principal: el cuerpo del aviso solo aporta un id
  // y el pago se consulta SIEMPRE a la API de Mercado Pago con nuestro token privado (monto, moneda y
  // external_reference se validan contra la orden). Por eso un aviso sin firma o con firma inválida se
  // registra pero no se descarta: Mercado Pago envía avisos IPN sin firma y, con cuentas de prueba, la
  // clave puede no coincidir; rechazarlos hacía que pagos reales nunca confirmaran la orden.
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret && request.headers.get("x-signature")) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId: url.searchParams.get("data.id") ?? paymentId,
        secret,
        toleranceSeconds: 600,
      });
    } catch (error) {
      if (!(error instanceof InvalidWebhookSignatureError)) throw error;
      console.warn("[mercadopago] firma no válida; se verifica el pago contra la API", { paymentId, reason: error.reason, requestId: error.requestId });
    }
  } else {
    console.info("[mercadopago] aviso sin firma; se verifica el pago contra la API", { paymentId, secretConfigured: Boolean(secret) });
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
