"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Truck } from "lucide-react";
import { FREE_SHIPPING_NATIONAL_MIN, FREE_SHIPPING_PEREIRA_MIN, LOCAL_CITY, freeShippingMin, isLocalCity } from "@/config/shipping";
import { formatPrice } from "@/lib/utils";

/**
 * Aviso de envío. Con `city` (checkout) usa el mínimo de esa ciudad; sin ciudad (carrito) muestra
 * los dos mínimos: Pereira y resto del país.
 */
export function ShippingNotice({ subtotal, city }: { subtotal: number; city?: string }) {
  const free = city ? subtotal >= freeShippingMin(city) : subtotal >= FREE_SHIPPING_NATIONAL_MIN;

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
        <motion.div key="paid" className="space-y-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          {city ? (
            isLocalCity(city) ? (
              <Progress subtotal={subtotal} min={freeShippingMin(city)} label={`en ${LOCAL_CITY}`} />
            ) : (
              <Progress subtotal={subtotal} min={FREE_SHIPPING_NATIONAL_MIN} national />
            )
          ) : (
            <>
              <Progress subtotal={subtotal} min={FREE_SHIPPING_PEREIRA_MIN} label={`en ${LOCAL_CITY}`} />
              <Progress subtotal={subtotal} min={FREE_SHIPPING_NATIONAL_MIN} national />
            </>
          )}
          <p className="text-[0.625rem] leading-snug text-steel/70">El envío se cobra dependiendo del producto y la localidad.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Progress({ subtotal, min, label = "", national = false }: { subtotal: number; min: number; label?: string; national?: boolean }) {
  const reached = subtotal >= min;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-[0.7rem] text-steel">
        {reached ? (
          <span className="flex items-center gap-1 text-arc">
            <Check className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> {national ? "Envío nacional GRATIS" : `Envío gratis ${label}`}
          </span>
        ) : (
          <span>
            Te faltan <span className="font-mono text-bone">{formatPrice(min - subtotal)}</span> {national ? "para envío nacional GRATIS" : `para envío gratis ${label}`}
          </span>
        )}
        <span className="shrink-0 font-mono">{formatPrice(min)}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden bg-line-strong">
        <motion.div className="h-full bg-arc" initial={false} animate={{ width: `${Math.min(subtotal / min, 1) * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  );
}
