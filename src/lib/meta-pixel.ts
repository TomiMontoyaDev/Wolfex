/** ID del Meta Pixel (es público: va en el HTML de la tienda). Se puede cambiar con NEXT_PUBLIC_META_PIXEL_ID. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1991868668165311";

/**
 * Código base oficial del Meta Pixel, para el <head> del layout raíz: queda escrito en el HTML
 * (así lo detecta el Administrador de eventos). No se activa en el panel /admin.
 */
export const META_PIXEL_BASE_CODE = `if(location.pathname.indexOf('/admin')!==0){
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
}`;

export const META_PIXEL_NOSCRIPT_SRC = `https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`;

/** Eventos que se envían al Pixel y, con el mismo event_id, a la API de Conversiones. */
export type MetaEvent = "ViewContent" | "AddToCart" | "InitiateCheckout" | "AddPaymentInfo" | "Purchase";

declare global {
  interface Window {
    fbq?: (command: "track" | "trackCustom" | "init", event: string, params?: Record<string, unknown>, options?: { eventID?: string }) => void;
  }
}

export interface TrackItem {
  /** SKU del producto (PN-XXX): el mismo id en Pixel, API de Conversiones y catálogo de Meta. */
  id: string;
  quantity: number;
  item_price: number;
}

export interface TrackParams {
  contents?: TrackItem[];
  /** Por defecto: suma de item_price × quantity. */
  value?: number;
  /** Datos que el cliente escribió en el checkout (se hashean en el servidor, nunca aquí). */
  customer?: { email?: string; phone?: string; name?: string; city?: string; department?: string };
  /** Purchase: external_reference del pedido; el servidor lo valida contra la base. */
  orderRef?: string;
}

export const newEventId = () => crypto.randomUUID();

/** Evento propio de la tienda (solo Pixel del navegador): sirve para medir modales y botones. */
export function trackCustom(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") window.fbq?.("trackCustom", eventName, params);
}

/** PageView del Pixel (solo navegador). Si el script no cargó (bloqueador, admin), no hace nada. */
export function trackPageView() {
  if (typeof window !== "undefined") window.fbq?.("track", "PageView");
}

/**
 * Registra un evento en el Pixel del navegador y lo reenvía a /api/meta-capi con el MISMO event_id,
 * para que Meta los cuente una sola vez. Nunca lanza errores hacia la tienda.
 */
export function track(eventName: MetaEvent, params: TrackParams = {}, eventId: string = newEventId()) {
  if (typeof window === "undefined") return;
  const contents = params.contents ?? [];
  const value = params.value ?? contents.reduce((sum, item) => sum + item.item_price * item.quantity, 0);

  try {
    window.fbq?.(
      "track",
      eventName,
      {
        currency: "COP",
        value,
        content_ids: contents.map((item) => item.id),
        content_type: "product",
        contents,
        num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
      },
      { eventID: eventId },
    );
  } catch {}

  // keepalive: el envío sobrevive aunque la página navegue enseguida (p. ej. hacia Mercado Pago).
  fetch("/api/meta-capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      event_name: eventName,
      event_id: eventId,
      event_source_url: window.location.href,
      items: contents.map((item) => ({ id: item.id, quantity: item.quantity })),
      customer: params.customer,
      order_ref: params.orderRef,
    }),
  }).catch(() => {});
}
