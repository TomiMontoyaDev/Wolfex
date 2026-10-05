import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCatalogProducts } from "@/lib/commerce";
import { db } from "@/server/db";
import { sendMetaEvent, type CapiContent, type CapiCustomer, type CapiRequestContext } from "@/server/meta-capi";

/**
 * Recibe los eventos del navegador y los reenvía a la API de Conversiones de Meta con el mismo event_id.
 * El navegador solo dice QUÉ pasó (evento, productos y cantidades): los precios salen del catálogo y,
 * en Purchase, todo sale del pedido aprobado en la base. Nada de lo que mande el cliente fija valores.
 */

const eventSchema = z.object({
  event_name: z.enum(["ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo", "Purchase"]),
  event_id: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
  event_source_url: z.string().url().max(2000),
  items: z.array(z.object({ id: z.string().min(1).max(40), quantity: z.number().int().min(1).max(99) })).max(50).default([]),
  customer: z
    .object({
      email: z.string().trim().max(160).optional(),
      phone: z.string().trim().max(30).optional(),
      name: z.string().trim().max(120).optional(),
      city: z.string().trim().max(80).optional(),
      department: z.string().trim().max(80).optional(),
    })
    .optional(),
  order_ref: z.string().uuid().optional(),
});

/** IP real del visitante (en Vercel llega en x-forwarded-for: la primera es la del cliente). */
function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

/** _fbc: cookie del Pixel o, si aún no existe, se arma con el fbclid del enlace del anuncio. */
function clickId(request: NextRequest, sourceUrl: string) {
  const cookie = request.cookies.get("_fbc")?.value;
  if (cookie) return cookie;
  const fbclid = new URL(sourceUrl).searchParams.get("fbclid");
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : null;
}

export async function POST(request: NextRequest) {
  try {
    return await handle(request);
  } catch (error) {
    // Medición, no checkout: si algo falla (p. ej. la base no responde) se registra y la tienda sigue igual.
    console.error("[meta-capi] no se pudo procesar el evento", error instanceof Error ? error.message : error);
    return NextResponse.json({ skipped: true }, { status: 202 });
  }
}

async function handle(request: NextRequest) {
  // Solo la propia tienda puede reportar eventos.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  const event = parsed.data;

  const context: CapiRequestContext = {
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
    fbp: request.cookies.get("_fbp")?.value ?? null,
    fbc: clickId(request, event.event_source_url),
  };

  let contents: CapiContent[];
  let value: number | undefined;
  let customer: CapiCustomer | undefined;
  let eventId = event.event_id;

  if (event.event_name === "Purchase") {
    // Purchase: solo con el pedido CONFIRMADO, y con su valor, productos y datos reales.
    if (!event.order_ref) return NextResponse.json({ error: "Falta el pedido." }, { status: 400 });
    const order = await db.order.findUnique({
      where: { externalReference: event.order_ref },
      select: {
        orderNumber: true,
        paymentStatus: true,
        total: true,
        customerEmail: true,
        customerPhone: true,
        customerName: true,
        shippingCity: true,
        shippingDepartment: true,
        items: { select: { sku: true, quantity: true, unitPrice: true } },
      },
    });
    if (!order || order.paymentStatus !== "APPROVED") return NextResponse.json({ skipped: true }, { status: 202 });
    eventId = order.orderNumber;
    contents = order.items.map((item) => ({ id: item.sku, quantity: item.quantity, item_price: item.unitPrice }));
    value = order.total;
    customer = { email: order.customerEmail, phone: order.customerPhone, name: order.customerName, city: order.shippingCity, department: order.shippingDepartment };
  } else {
    // Resto de eventos: precios del catálogo real (en caché), por SKU. Productos desconocidos se ignoran.
    const catalog = new Map((await getCatalogProducts()).map((product) => [product.sku, product]));
    contents = event.items.flatMap((item) => {
      const product = catalog.get(item.id);
      return product ? [{ id: product.sku, quantity: item.quantity, item_price: product.price }] : [];
    });
    if (!contents.length) return NextResponse.json({ skipped: true }, { status: 202 });
    customer = event.event_name === "AddPaymentInfo" ? event.customer : undefined;
  }

  // Se responde de inmediato; el envío a Meta corre después y no hace esperar al cliente.
  after(() =>
    sendMetaEvent({ eventName: event.event_name, eventId, eventSourceUrl: event.event_source_url, contents, value, customer, context }),
  );
  return NextResponse.json({ ok: true }, { status: 202 });
}
