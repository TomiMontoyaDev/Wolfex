"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Truck } from "lucide-react";
import { FREE_SHIPPING_MIN } from "@/data/site";
import { formatPrice } from "@/lib/utils";

/** Aviso de envío del carrito: "¡ENVÍO GRATIS!" desde FREE_SHIPPING_MIN; si no, cuánto falta y que el envío se cobra aparte. */
export function ShippingNotice({ subtotal }: { subtotal: number }) {
  const free = subtotal >= FREE_SHIPPING_MIN;
  const progress = Math.min(subtotal / FREE_SHIPPING_MIN, 1);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {free ? (
        <motion.div
          key="free"
          className="flex items-center justify-center gap-2 border border-arc/60 bg-arc/10 px-3 py-2.5 shadow-[0_0_30px_-8px_rgba(0,168,255,0.7)]"
          initial={{ opacity: 0, scale: 0.9, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          role="status"
        >
          <motion.span initial={{ x: -10 }} animate={{ x: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 300 }}>
            <Truck className="h-4 w-4 text-arc" strokeWidth={1.75} aria-hidden="true" />
          </motion.span>
          <span className="type-title text-sm text-arc">¡ENVÍO GRATIS!</span>
        </motion.div>
      ) : (
        <motion.div key="paid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <div className="flex items-center justify-between gap-3 text-[0.7rem] text-steel">
            <span>
              Te faltan <span className="font-mono text-bone">{formatPrice(FREE_SHIPPING_MIN - subtotal)}</span> para envío gratis
            </span>
            <span className="font-mono">{formatPrice(FREE_SHIPPING_MIN)}</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden bg-line-strong">
            <motion.div className="h-full bg-arc" initial={false} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
          </div>
          <p className="mt-1.5 text-[0.625rem] leading-snug text-steel/70">El envío se cobra dependiendo del producto y la localidad.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
