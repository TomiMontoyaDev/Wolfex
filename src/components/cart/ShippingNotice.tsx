"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Truck } from "lucide-react";
import {
  FREE_SHIPPING_NATIONAL_MIN,
  FREE_SHIPPING_PEREIRA_MIN,
  LOCAL_ZONE_LABEL,
  SHIPPING_RATE_LOCAL,
  SHIPPING_RATE_NATIONAL,
  WEIGHT_SURCHARGE,
  quoteShipping,
  weightSurcharge,
} from "@/config/shipping";
import { formatPrice } from "@/lib/utils";

/**
 * Envío visible antes de pagar. Con `city` (checkout): el costo exacto de esa ciudad.
 * Sin ciudad (carrito): la tarifa de las dos zonas con su barra "Te faltan $X para envío GRATIS".
 * `subtotal` = productos menos descuento de combo.
 */
export function ShippingNotice({ subtotal, weightKg = 0, city, department }: { subtotal: number; weightKg?: number; city?: string; department?: string }) {
  const surcharge = weightSurcharge(weightKg);
  const quote = city ? quoteShipping({ subtotal, weightKg, city, department }) : null;
  const allFree = quote ? quote.free : subtotal >= FREE_SHIPPING_NATIONAL_MIN;

  if (quote?.zone === "quote") {
    return <p className="border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-xs text-amber-100">Envío a cotizar: tu departamento no tiene pago en línea. Escríbenos por WhatsApp y te ayudamos a terminar la compra.</p>;
  }

  return (
    <div className="space-y-2.5">
      <AnimatePresence mode="wait" initial={false}>
        {allFree ? (
          <motion.div
            key="free"
            className="flex items-center justify-center gap-2 border border-arc/60 bg-arc/10 px-3 py-2.5 shadow-[0_0_30px_-8px_rgba(0,168,255,0.7)]"
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            role="status"
          >
            <Truck className="h-4 w-4 text-arc" strokeWidth={1.75} aria-hidden="true" />
            <span className="type-title text-sm text-arc">¡ENVÍO GRATIS!</span>
          </motion.div>
        ) : (
          <motion.div key="paid" className="space-y-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {quote ? (
              <Progress subtotal={subtotal} min={quote.zone === "local" ? FREE_SHIPPING_PEREIRA_MIN : FREE_SHIPPING_NATIONAL_MIN} fee={quote.base} label={quote.zone === "local" ? `en ${LOCAL_ZONE_LABEL}` : "nacional"} />
            ) : (
              <>
                <Progress subtotal={subtotal} min={FREE_SHIPPING_PEREIRA_MIN} fee={SHIPPING_RATE_LOCAL} label={`en ${LOCAL_ZONE_LABEL}`} />
                <Progress subtotal={subtotal} min={FREE_SHIPPING_NATIONAL_MIN} fee={SHIPPING_RATE_NATIONAL} label="al resto del país" />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {surcharge > 0 && (
        <p className="text-[0.68rem] leading-snug text-steel">
          + {formatPrice(surcharge)} por peso (pedido de {weightKg.toFixed(1).replace(".", ",")} kg; incluye {WEIGHT_SURCHARGE.includedKg} kg).
        </p>
      )}
    </div>
  );
}

function Progress({ subtotal, min, fee, label }: { subtotal: number; min: number; fee: number; label: string }) {
  const reached = subtotal >= min;
  return (
    <div>
      <div className="flex items-start justify-between gap-3 text-[0.72rem] text-steel">
        {reached ? (
          <span className="flex items-center gap-1 text-arc">
            <Check className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> Envío GRATIS {label}
          </span>
        ) : (
          <span>
            Te faltan <span className="font-mono text-bone">{formatPrice(min - subtotal)}</span> para envío GRATIS {label}
          </span>
        )}
        <span className="shrink-0 font-mono text-bone">{reached ? "GRATIS" : formatPrice(fee)}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden bg-line-strong">
        <motion.div className="h-full bg-arc" initial={false} animate={{ width: `${Math.min(subtotal / min, 1) * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  );
}
