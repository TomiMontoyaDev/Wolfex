"use client";

import { useEffect } from "react";
import { trackPixel } from "@/lib/meta-pixel";

/**
 * Evento Purchase del Meta Pixel. Solo se monta cuando el pago está CONFIRMADO en la base.
 * El número de pedido va como eventID y se recuerda en el navegador: recargar la página no duplica la compra.
 */
export function PurchasePixel({ orderNumber, value, contentIds }: { orderNumber: string; value: number; contentIds: string[] }) {
  useEffect(() => {
    const key = `wfx-pixel-purchase-${orderNumber}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {}
    // El script del Pixel carga después de hidratar: se espera un momento a que exista fbq.
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (window.fbq) {
        trackPixel("Purchase", { value, currency: "COP", content_ids: contentIds, content_type: "product" }, orderNumber);
        try {
          localStorage.setItem(key, "1");
        } catch {}
        clearInterval(timer);
      } else if (tries > 20) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [orderNumber, value, contentIds]);

  return null;
}
