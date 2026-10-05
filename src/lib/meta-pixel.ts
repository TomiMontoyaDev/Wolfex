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

type StandardEvent = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";

declare global {
  interface Window {
    fbq?: (command: "track" | "init", event: string, params?: Record<string, unknown>, options?: { eventID?: string }) => void;
  }
}

/** Envía un evento estándar al Pixel. Si el script no cargó (bloqueador de anuncios, admin), no hace nada. */
export function trackPixel(event: StandardEvent, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params, eventId ? { eventID: eventId } : undefined);
}
