import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";

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

    return NextResponse.json({
      orderId: order.id,
      invoice: order.invoice,
      amount: order.total,
      currency: order.currency,
      description: `Compra WOLFEX ${order.invoice}`,
      publicKey: process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY ?? "",
      test: process.env.EPAYCO_TEST_MODE !== "false",
      responseUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin}/payment/result`,
      confirmationUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin}/api/epayco/confirmation`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible crear la orden.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
