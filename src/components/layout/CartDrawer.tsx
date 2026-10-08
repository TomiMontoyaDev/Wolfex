"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { ComboProgress } from "@/components/combo/ComboSection";
import { useComboQuote } from "@/components/combo/useComboQuote";
import { comboStatus } from "@/lib/combo";
import { useRouter } from "next/navigation";
import { ShippingNotice } from "@/components/cart/ShippingNotice";
import { useCart } from "@/components/providers/CartProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { AnimatedPrice, QuantityStepper } from "@/components/cart/QuantityStepper";
import { Media } from "@/components/ui/Media";
import { formatPrice } from "@/lib/utils";

/** Slide-in bag. Checkout is wired through /src/lib/commerce.ts later. */
export function CartDrawer() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isOpen, close, lines, subtotal, remove, setQuantity, count } = useCart();
  const quoteLines = useMemo(() => lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })), [lines]);
  const { quote } = useComboQuote(quoteLines);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-void/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-volt/15 bg-ink"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            role="dialog"
            aria-label={t("Bag")}
          >
            <div className="flex h-[var(--nav-h)] items-center justify-between border-b border-line px-6">
              <p className="type-title text-sm">{t("Bag")} <span className="text-steel">({count})</span></p>
              <button onClick={close} aria-label={t("Close bag")} className="-mr-2 flex h-11 w-11 items-center justify-center"><X className="h-5 w-5" strokeWidth={1.5} /></button>
            </div>

            <div className="relative flex-1 overflow-y-auto px-6">
              {lines.length === 0 && (
                // Aparece después de que la última línea termina de salir.
                <motion.div className="absolute inset-0 flex flex-col items-center justify-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.3 }}>
                  <p className="type-headline text-3xl">{t("No comfort.")}<br />{t("No items.")}</p>
                  <p className="mt-4 type-label text-steel">{t("Your bag is empty")}</p>
                </motion.div>
              )}
                <ul>
                  {/* initial={false}: al abrir el carrito las líneas ya están; solo se animan las que entran o salen. */}
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <motion.li
                        key={l.key}
                        className="overflow-hidden border-b border-line last:border-b-0"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0, x: 40 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="flex gap-4 py-5">
                          <div className="relative aspect-[4/5] w-20 shrink-0">
                            <Media slot={l.product.images.primary} sizes="80px" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <p className="type-label text-steel">{l.product.sku}</p>
                            <p className="mt-1 type-title text-sm">WOLFEX {l.product.name}</p>
                            <p className="mt-1 text-xs text-steel">{l.color}</p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <QuantityStepper value={l.quantity} label={l.product.name} onChange={(quantity) => setQuantity(l.key, quantity)} />
                              <AnimatedPrice value={l.product.price * l.quantity} />
                            </div>
                            <button onClick={() => remove(l.key)} className="mt-3 self-end type-label text-steel transition-colors hover:text-arc">{t("Remove")}</button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
            </div>

            <div className="border-t border-line p-6">
              {lines.length > 0 && (
                <div className="mb-5 space-y-4">
                  <ComboProgress {...comboStatus(lines.map((line) => ({ productId: line.product.id, price: line.product.price })))} />
                  <ShippingNotice subtotal={subtotal - quote.discount} />
                </div>
              )}
              <div className="flex justify-between text-sm text-steel">
                <span>{t("Subtotal")}</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="mt-1.5 flex justify-between text-sm text-arc">
                  <span>Descuento combo</span>
                  <span className="font-mono">− {formatPrice(quote.discount)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-line pt-2 type-title text-sm">
                <span>Total</span>
                <AnimatedPrice value={subtotal - quote.discount} className="font-mono" />
              </div>
              <button
                disabled={!lines.length}
                onClick={() => {
                  close();
                  router.push("/checkout");
                }}
                className="mt-5 h-14 w-full bg-volt type-title text-[0.8125rem] transition-opacity disabled:opacity-40"
              >
                {t("Checkout")}
              </button>
              <p className="mt-3 text-center type-label text-steel/70">Pago seguro con Mercado Pago</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
