"use client";

import { useEffect } from "react";
import { track, type TrackItem } from "@/lib/meta-pixel";

/**
 * Evento Purchase (Pixel + API de Conversiones). Solo se monta cuando el pago está CONFIRMADO en la base.
 * event_id = número de pedido, y se recuerda en el navegador: recargar la página de confirmación no lo repite.
 * (Si se abriera desde otro navegador, Meta igual lo deduplica por el mismo event_id.)
 */
export function PurchasePixel({ orderNumber, orderRef, value, contents }: { orderNumber: string; orderRef: string; value: number; contents: TrackItem[] }) {
  useEffect(() => {
    const key = `wfx-meta-purchase-${orderNumber}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}

    // El script del Pixel puede tardar en cargar: se espera hasta ~3 s. Si no aparece (bloqueador),
    // track() igual envía la compra por la API de Conversiones.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (window.fbq || tries >= 12) {
        clearInterval(timer);
        track("Purchase", { contents, value, orderRef }, orderNumber);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [orderNumber, orderRef, value, contents]);

  return null;
}
