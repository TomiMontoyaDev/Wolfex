"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Package, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/components/providers/CartProvider";
import { Media } from "@/components/ui/Media";
import type { Product } from "@/data/products";
import { productSize } from "@/lib/product-size";
import { cn, formatPrice } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Ficha rápida del producto: para qué sirve, contenido y agregar al carrito. */
export function ProductModal({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const { add } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sizes = productSize(product.name);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.documentElement.style.overflow = "hidden";
    const timer = setTimeout(() => closeRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  function onAdd() {
    add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  // Portal: las tarjetas usan transform (animación de entrada), lo que rompería el `fixed` del modal.
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 cursor-default bg-void/80 backdrop-blur-md" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`product-${product.id}-title`}
            className="relative flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden border border-volt/25 bg-ink shadow-[0_40px_140px_-40px_rgba(0,102,255,0.7)] sm:flex-row"
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center border border-line-strong bg-void/70 text-bone backdrop-blur-md transition-colors hover:border-arc hover:text-arc"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <div className="relative h-44 shrink-0 overflow-hidden bg-void sm:h-auto sm:w-[42%]">
              <Media slot={product.images.primary} sizes="(min-width:640px) 320px, 100vw" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-ink/40" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6 sm:p-8">
              <Stagger delay={0.1}>
                <p className="type-label text-arc">{product.brand}</p>
                <h2 id={`product-${product.id}-title`} className="mt-2 pr-10 type-title text-xl leading-tight text-bone md:text-2xl">
                  {product.name}
                </h2>
              </Stagger>

              <Stagger delay={0.18} className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={cn("font-mono text-2xl", product.compareAtPrice ? "text-arc" : "text-bone")}>{formatPrice(product.price)}</span>
                {product.compareAtPrice && <s className="font-mono text-sm text-steel">{formatPrice(product.compareAtPrice)}</s>}
                {product.delivery && (
                  <span className={cn("flex items-center gap-1.5 type-label", product.delivery === "STOCK" ? "text-arc" : "text-steel")}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", product.delivery === "STOCK" ? "bg-arc" : "bg-steel")} aria-hidden="true" />
                    {product.delivery === "STOCK" ? "Entrega inmediata en Pereira" : "Envío nacional"}
                  </span>
                )}
              </Stagger>

              {product.descriptor && (
                <Stagger delay={0.26} className="mt-6">
                  <p className="type-label text-steel">¿Para qué sirve?</p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-bone/90">{product.descriptor}</p>
                </Stagger>
              )}

              {sizes.length > 0 && (
                <Stagger delay={0.34} className="mt-6">
                  <p className="type-label text-steel">Contenido / tamaño</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <li key={size} className="flex items-center gap-2 border border-line-strong px-3 py-2 type-label text-bone">
                        <Package className="h-3.5 w-3.5 text-arc" strokeWidth={1.5} aria-hidden="true" />
                        {size}
                      </li>
                    ))}
                  </ul>
                </Stagger>
              )}

              <Stagger delay={0.42} className="mt-auto pt-8">
                {product.available ? (
                  <button
                    type="button"
                    onClick={onAdd}
                    className={cn(
                      "flex h-12 w-full items-center justify-between border px-4 type-label transition-colors",
                      added ? "border-bone bg-bone text-void" : "border-volt bg-volt text-bone hover:border-arc hover:bg-arc hover:text-void",
                    )}
                  >
                    {added ? "Agregado al carrito" : "Agregar al carrito"}
                    {added ? <Check className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={1.5} />}
                  </button>
                ) : (
                  <p className="flex h-12 items-center justify-center border border-line-strong type-label text-steel">Agotado</p>
                )}
                <p className="mt-3 text-xs text-steel/80">Suplemento dietario. No reemplaza una alimentación balanceada.</p>
              </Stagger>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Stagger({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}
