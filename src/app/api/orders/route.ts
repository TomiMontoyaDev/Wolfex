import { NextResponse } from "next/server";
import { createOrder, updateOrder } from "@/lib/orders";
import { preferences, siteUrl } from "@/lib/mercadopago";

function stringField(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) throw new Error(`Campo inválido: ${field}.`);
  return value.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body.lines)) throw new Error("Líneas de carrito inválidas.");
    const customer = {
      name: stringField(body.customer?.name, "nombre", 120),
      email: stringField(body.customer?.email, "email", 160),
      phone: stringField(body.customer?.phone, "teléfono", 40),
      address: stringField(body.customer?.address, "dirección", 240),
    };
    const order = createOrder(
      body.lines.map((line: { productId?: unknown; color?: unknown; quantity?: unknown }) => ({
        productId: stringField(line.productId, "producto", 120),
        color: typeof line.color === "string" ? line.color.slice(0, 80) : "Default",
        quantity: line.quantity,
      })),
      customer,
    );

    const base = siteUrl(request);
    const isPublic = base.startsWith("https://");
    const preference = await preferences().create({
      body: {
        items: order.lines.map((line) => ({
          id: line.sku,
          title: `${line.name} · ${line.color}`,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          currency_id: order.currency,
        })),
        payer: { name: customer.name, email: customer.email, phone: { number: customer.phone }, address: { street_name: customer.address } },
        external_reference: order.invoice,
        statement_descriptor: "WOLFEX",
        back_urls: {
          success: `${base}/payment/result`,
          pending: `${base}/payment/result`,
          failure: `${base}/payment/result`,
        },
        // Mercado Pago rechaza auto_return y notification_url con URLs locales (http://localhost).
        ...(isPublic && { auto_return: "approved", notification_url: `${base}/api/mercadopago/webhook` }),
      },
      requestOptions: { idempotencyKey: order.id },
    });
    if (!preference.id || !preference.init_point) throw new Error("Mercado Pago no devolvió el enlace de pago.");
    updateOrder(order.id, { mercadopago: { preferenceId: preference.id } });

    return NextResponse.json({ orderId: order.id, invoice: order.invoice, checkoutUrl: preference.init_point });
  } catch (error) {
    console.error("[orders] create failed", error);
    const message = error instanceof Error ? error.message : "No fue posible crear la orden.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
