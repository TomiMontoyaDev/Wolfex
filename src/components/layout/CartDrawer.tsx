"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Media } from "@/components/ui/Media";
import { formatPrice } from "@/lib/utils";

/** Slide-in bag. Checkout is wired through /src/lib/commerce.ts later. */
export function CartDrawer() {
  const { t } = useLanguage();
  const { isOpen, close, lines, subtotal, remove, count } = useCart();

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

            <div className="flex-1 overflow-y-auto px-6">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="type-headline text-3xl">{t("No comfort.")}<br />{t("No items.")}</p>
                  <p className="mt-4 type-label text-steel">{t("Your bag is empty")}</p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {lines.map((l) => (
                    <li key={l.key} className="flex gap-4 py-5">
                      <div className="relative aspect-[4/5] w-20 shrink-0">
                        <Media slot={l.product.images.primary} sizes="80px" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <p className="type-label text-steel">{l.product.sku}</p>
                        <p className="mt-1 type-title text-sm">WOLFEX {l.product.name}</p>
                        <p className="mt-1 text-xs text-steel">{l.color} · Qty {l.quantity}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="font-mono text-sm">{formatPrice(l.product.price * l.quantity)}</span>
                          <button onClick={() => remove(l.key)} className="type-label text-steel hover:text-arc">{t("Remove")}</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-line p-6">
              <div className="flex justify-between type-title text-sm">
                <span>{t("Subtotal")}</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              <button disabled={!lines.length} className="mt-5 h-14 w-full bg-volt type-title text-[0.8125rem] transition-opacity disabled:opacity-40">
                {t("Checkout")}
              </button>
              <p className="mt-3 text-center type-label text-steel/70">{t("Secure checkout · Launching with the first drop")}</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
