import { NextResponse } from "next/server";
import { siteUrl } from "@/server/mercadopago";
import { trackingFromRequest } from "@/server/meta-purchase";
import { CheckoutError, createMercadoPagoCheckout, createOrder } from "@/server/orders";
import { checkoutSchema, firstIssue, idempotencyKeySchema } from "@/server/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const key = idempotencyKeySchema.safeParse(request.headers.get("idempotency-key"));

  try {
    // Señales de Meta (cookies del Pixel, IP, navegador) para atribuir la compra aunque el cliente no vuelva.
    const { order } = await createOrder(parsed.data, key.success ? key.data : undefined, trackingFromRequest(request));
    // Transferencia o recoger: el pedido queda pendiente de pago y el cliente ve los datos en /pedido/<referencia privada>.
    if (order.paymentProvider !== "MERCADOPAGO") {
      return NextResponse.json({ orderNumber: order.orderNumber, redirectUrl: `/pedido/${order.externalReference}` });
    }
    const checkoutUrl = await createMercadoPagoCheckout(order, siteUrl(request));
    return NextResponse.json({ orderNumber: order.orderNumber, checkoutUrl });
  } catch (error) {
    if (error instanceof CheckoutError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("[orders] create failed", error);
    return NextResponse.json({ error: "No fue posible iniciar el pago. Intenta de nuevo en unos minutos." }, { status: 500 });
  }
}
