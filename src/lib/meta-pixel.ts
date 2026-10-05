/** ID del Meta Pixel (es público: va en el HTML de la tienda). Se puede cambiar con NEXT_PUBLIC_META_PIXEL_ID. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1991868668165311";

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
