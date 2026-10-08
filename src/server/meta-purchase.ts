import "server-only";
import { SITE } from "@/data/site";
import { parseVisitorId, VISITOR_COOKIE } from "@/lib/visitor";
import { db } from "./db";
import { sendMetaEvent, type CapiRequestContext } from "./meta-capi";

/** Datos de medición que se guardan en el pedido al crearlo (Order.tracking). */
export interface OrderTracking extends CapiRequestContext {
  sourceUrl?: string | null;
}

/** Lee del request las señales que Meta usa para atribuir la compra (cookies del Pixel, IP, navegador). */
export function trackingFromRequest(request: Request): OrderTracking {
  const cookies = new Map(
    (request.headers.get("cookie") ?? "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter((pair) => pair.length >= 2)
      .map(([key, ...rest]) => [key, decodeURIComponent(rest.join("="))]),
  );
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null,
    userAgent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
    fbp: cookies.get("_fbp")?.slice(0, 200) ?? null,
    fbc: cookies.get("_fbc")?.slice(0, 400) ?? null,
    visitorId: parseVisitorId(cookies.get(VISITOR_COOKIE)),
    sourceUrl: request.headers.get("referer")?.slice(0, 1000) ?? null,
  };
}

/**
 * Envía el Purchase de un pedido pagado a la API de Conversiones, UNA sola vez:
 * reclama el envío de forma atómica (metaPurchaseSentAt) y, si Meta falla, libera la marca para reintentar.
 * Lo llaman el webhook de Mercado Pago (aunque el cliente no vuelva) y la página de confirmación.
 * event_id = número de pedido, el mismo del Pixel del navegador: Meta deduplica ambos.
 */
export async function sendOrderPurchase(orderId: string, live?: CapiRequestContext): Promise<void> {
  try {
    const claimed = await db.$queryRaw<Array<{ id: string }>>`
      UPDATE "Order" SET "metaPurchaseSentAt" = now()
      WHERE id = ${orderId} AND "metaPurchaseSentAt" IS NULL AND "paymentStatus" = 'APPROVED' AND "paymentProvider" = 'MERCADOPAGO'
      RETURNING id`;
    if (!claimed.length) return;

    const order = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      select: {
        orderNumber: true,
        total: true,
        paidAt: true,
        tracking: true,
        customerEmail: true,
        customerPhone: true,
        customerName: true,
        shippingCity: true,
        shippingDepartment: true,
        items: { select: { sku: true, quantity: true, unitPrice: true, unitDiscount: true } },
      },
    });
    const stored = (order.tracking ?? {}) as OrderTracking;
    // Señales del navegador en vivo si las hay (página de confirmación); si no, las guardadas al crear el pedido.
    const context: CapiRequestContext = {
      ip: live?.ip ?? stored.ip,
      userAgent: live?.userAgent ?? stored.userAgent,
      fbp: live?.fbp ?? stored.fbp,
      fbc: live?.fbc ?? stored.fbc,
      visitorId: live?.visitorId ?? stored.visitorId,
    };
    const ok = await sendMetaEvent({
      eventName: "Purchase",
      eventId: order.orderNumber,
      eventSourceUrl: stored.sourceUrl || `${SITE.url}/checkout`,
      eventTime: order.paidAt ?? undefined,
      // Precio cobrado por unidad (con el descuento de combo aplicado).
      contents: order.items.map((item) => ({ id: item.sku, quantity: item.quantity, item_price: item.unitPrice - item.unitDiscount })),
      value: order.total,
      customer: { email: order.customerEmail, phone: order.customerPhone, name: order.customerName, city: order.shippingCity, department: order.shippingDepartment },
      context,
    });
    if (!ok) await db.order.update({ where: { id: orderId }, data: { metaPurchaseSentAt: null } });
  } catch (error) {
    console.error("[meta-purchase] no se pudo enviar el Purchase", { orderId, error: error instanceof Error ? error.message : error });
  }
}
