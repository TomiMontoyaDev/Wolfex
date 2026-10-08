"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { Media } from "@/components/ui/Media";
import { deliveryLabel } from "@/config/shipping";
import { comboStatus } from "@/lib/combo";
import { formatPrice } from "@/lib/utils";
import { ComboProgress } from "./ComboSection";
import type { ComboQuote } from "./useComboQuote";

/**
 * "Completa tu combo" en el checkout: productos de categorías que el cliente aún no tiene,
 * elegidos por el servidor entre los que tienen margen para el descuento.
 */
export function ComboUpsell({ quote }: { quote: ComboQuote }) {
  const { add, lines } = useCart();
  // Nivel al instante (el carrito ya tiene los precios); las sugerencias y el monto vienen del servidor.
  const status = comboStatus(lines.map((line) => ({ productId: line.product.id, price: line.product.price })));
  // Se ocultan sugerencias que el cliente ya agregó mientras llega la nueva cotización.
  const suggestions = quote.suggestions.filter((product) => !lines.some((line) => line.product.id === product.id));
  if (!suggestions.length) return null;

  return (
    <div className="relative mt-7 border border-arc/40 bg-arc/5 p-4">
      <p className="flex items-center gap-2 type-label text-arc">
        <Sparkles className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        {status.next ? "Completa tu combo y ahorra más" : "Complementa tu pedido"}
      </p>
      <ComboProgress {...status} className="mt-3" />
      <ul className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {suggestions.map((product) => (
            <motion.li
              key={product.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-3 border border-line-strong bg-void/60 p-3"
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-ink ring-1 ring-inset ring-line-strong">
                <Media slot={product.images.primary} sizes="56px" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="type-label text-steel">{product.category.toLowerCase()}</p>
                <p className="mt-0.5 truncate text-sm text-bone">{product.name}</p>
                <p className="mt-0.5 text-xs text-steel">
                  <span className="font-mono text-bone/80">{formatPrice(product.price)}</span>
                  {product.delivery && <span className={product.delivery === "STOCK" ? "text-arc" : undefined}> · {deliveryLabel(product.delivery)}</span>}
                </p>
              </div>
              <button
                type="button"
                // En el checkout no se abre el carrito: el resumen ya está a la vista.
                onClick={() => add(product, undefined, { open: false })}
                aria-label={`Agregar ${product.name}`}
                className="flex h-10 shrink-0 items-center gap-1.5 border border-volt/60 px-3 type-label text-bone transition-colors hover:bg-volt"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} /> Agregar
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
