"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Package, Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { COMBO_BUILDER_SLOTS, COMBO_MIN_ITEM_PRICE, COMBO_TIERS } from "@/config/combos";
import { deliveryLabel } from "@/config/shipping";
import type { Product } from "@/data/products";
import { MAX_COMBO_PERCENT, comboStatus } from "@/lib/combo";
import { cn, formatPrice } from "@/lib/utils";
import type { RecommendedComboView } from "@/server/combo";
import { useComboQuote } from "./useComboQuote";

/** Sección "Arma tu combo": combos recomendados + armador propio con precio de combo en vivo. */
export function ComboSection({ combos, options }: { combos: RecommendedComboView[]; options: Record<string, Product[]> }) {
  return (
    <section id="combos" className="relative scroll-mt-28 bg-ink py-24 md:py-36" aria-label="Combos">
      <div className="container-wfx">
        <SectionLabel index="02" label="Combos" meta={`Hasta ${MAX_COMBO_PERCENT}% de descuento`} />
        <div className="mt-12 flex flex-col gap-8 md:mt-16 md:flex-row md:items-end md:justify-between">
          <SplitReveal as="h2" text="Arma tu combo" className="type-display text-[clamp(3rem,9vw,8.5rem)]" />
          <Reveal delay={0.2} className="max-w-md md:pb-3">
            <p className="type-body text-steel">
              Entre más productos distintos lleves, más ahorras. El descuento se aplica solo en el carrito, sin códigos.
            </p>
            <TierPills className="mt-5" />
          </Reveal>
        </div>

        {combos.length > 0 && (
          <>
            <p className="mt-16 type-label text-steel">Combos recomendados</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {combos.map((combo, i) => (
                <RecommendedCard key={combo.id} combo={combo} index={i} />
              ))}
            </div>
          </>
        )}

        <ComboBuilder options={options} />
      </div>
    </section>
  );
}

function TierPills({ className, active }: { className?: string; active?: number }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {COMBO_TIERS.map((tier) => (
        <li
          key={tier.minItems}
          className={cn(
            "border px-3 py-2 type-label transition-colors",
            active === tier.percent ? "border-arc bg-arc text-void" : "border-line-strong text-bone/80",
          )}
        >
          {tier.minItems}
          {tier.minItems === COMBO_TIERS.at(-1)!.minItems ? "+" : ""} productos · hasta −{tier.percent}%
        </li>
      ))}
    </ul>
  );
}

function useAddAll() {
  const { add, open } = useCart();
  const [added, setAdded] = useState(false);
  const addAll = (products: Product[]) => {
    for (const product of products) add(product);
    setAdded(true);
    open();
    setTimeout(() => setAdded(false), 1800);
  };
  return { added, addAll };
}

function RecommendedCard({ combo, index }: { combo: RecommendedComboView; index: number }) {
  const { added, addAll } = useAddAll();
  return (
    <motion.article
      className="flex flex-col border border-line-strong bg-void p-6 transition-colors duration-500 hover:border-arc/60 md:p-7"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="type-label text-arc">{combo.goal}</span>
        {combo.discount > 0 && <span className="bg-arc px-2 py-1 font-mono text-xs font-semibold text-void">−{formatPrice(combo.discount)}</span>}
      </div>
      <h3 className="mt-3 type-title text-xl text-bone">{combo.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-steel">{combo.description}</p>
      <ul className="mt-5 flex-1 space-y-2.5 border-t border-line pt-5">
        {combo.products.map((product) => (
          <li key={product.id} className="flex items-start justify-between gap-3 text-sm">
            <span className="flex items-start gap-2 text-bone/90">
              <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-arc" strokeWidth={1.5} aria-hidden="true" />
              <span>
                {product.name}
                {product.delivery === "STOCK" && <span className="mt-0.5 block type-label text-[0.6rem] text-arc">{deliveryLabel("STOCK")}</span>}
              </span>
            </span>
            <span className="shrink-0 font-mono text-steel">{formatPrice(product.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-5">
        <div>
          {combo.discount > 0 && <s className="block font-mono text-xs text-steel">{formatPrice(combo.subtotal)}</s>}
          <span className="font-mono text-2xl text-bone">{formatPrice(combo.total)}</span>
        </div>
        {combo.discount > 0 && <span className="type-label text-arc">Ahorras {formatPrice(combo.discount)}</span>}
      </div>
      <button
        type="button"
        onClick={() => addAll(combo.products)}
        className={cn("mt-5 flex h-12 items-center justify-between px-4 type-label transition-colors", added ? "bg-bone text-void" : "bg-volt text-bone hover:bg-arc hover:text-void")}
      >
        {added ? "Combo agregado" : "Agregar combo al carrito"}
        {added ? <Check className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={1.5} />}
      </button>
    </motion.article>
  );
}

function ComboBuilder({ options }: { options: Record<string, Product[]> }) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const { added, addAll } = useAddAll();
  const allOptions = useMemo(() => Object.values(options).flat(), [options]);
  const selected = useMemo(
    () => Object.values(picked).flatMap((id) => allOptions.filter((product) => product.id === id).slice(0, 1)),
    [picked, allOptions],
  );
  const lines = useMemo(() => selected.map((product) => ({ productId: product.id, quantity: 1 })), [selected]);
  const { quote, loading } = useComboQuote(lines);
  const status = comboStatus(selected.map((product) => ({ productId: product.id, price: product.price })));
  const subtotal = selected.reduce((sum, product) => sum + product.price, 0);
  const total = subtotal - quote.discount;

  return (
    <div className="mt-20 grid gap-8 border border-line-strong bg-void p-6 md:p-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)] lg:gap-12">
      <div>
        <p className="flex items-center gap-2 type-label text-arc">
          <Sparkles className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Arma el tuyo
        </p>
        <h3 className="mt-3 type-title text-2xl text-bone">Elige lo que necesitas y mira el precio de combo al instante</h3>
        <p className="mt-2 text-sm text-steel">Todos los pasos son opcionales. Cuentan productos desde {formatPrice(COMBO_MIN_ITEM_PRICE)}.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {COMBO_BUILDER_SLOTS.map((slot, i) => {
            const slotOptions = options[slot.id] ?? [];
            if (!slotOptions.length) return null;
            const value = picked[slot.id] ?? "";
            return (
              <label key={slot.id} className={cn("block border p-4 transition-colors", value ? "border-arc/60 bg-arc/5" : "border-line-strong")}>
                <span className="flex items-center justify-between type-label">
                  <span className="text-bone">
                    <span className="mr-2 font-mono text-arc">0{i + 1}</span>
                    {slot.label}
                  </span>
                  {value && <Check className="h-4 w-4 text-arc" strokeWidth={2} aria-hidden="true" />}
                </span>
                <span className="mt-1 block text-xs text-steel">{slot.hint}</span>
                <span className="relative mt-3 block">
                  <select
                    value={value}
                    onChange={(event) => setPicked((current) => ({ ...current, [slot.id]: event.target.value }))}
                    className="h-12 w-full cursor-pointer appearance-none rounded-sm border border-line-strong bg-ink px-3 pr-9 text-sm text-bone outline-none focus:border-arc"
                  >
                    <option value="">Sin {slot.label.toLowerCase()}</option>
                    {slotOptions.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {formatPrice(product.price)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" strokeWidth={1.5} aria-hidden="true" />
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <aside className="flex flex-col border border-line-strong bg-ink p-6" aria-live="polite">
        <p className="type-label text-steel">Tu combo</p>
        {selected.length === 0 ? (
          <p className="mt-4 flex-1 text-sm text-steel">Elige al menos 2 productos para activar el descuento de combo.</p>
        ) : (
          <ul className="mt-4 flex-1 space-y-2 text-sm">
            <AnimatePresence initial={false}>
              {selected.map((product) => (
                <motion.li key={product.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex justify-between gap-3">
                  <span className="text-bone/90">{product.name}</span>
                  <span className="shrink-0 font-mono text-steel">{formatPrice(product.price)}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        <ComboProgress {...status} className="mt-6" />

        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-steel">
            <dt>Subtotal</dt>
            <dd className="font-mono">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-arc">
            <dt>Descuento combo</dt>
            <dd className={cn("font-mono transition-opacity", loading && "opacity-50")}>{quote.discount ? `− ${formatPrice(quote.discount)}` : formatPrice(0)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 type-title text-lg text-bone">
            <dt>Total</dt>
            <dd className={cn("font-mono transition-opacity", loading && "opacity-50")}>{formatPrice(total)}</dd>
          </div>
        </dl>
        <button
          type="button"
          disabled={!selected.length}
          onClick={() => addAll(selected)}
          className={cn(
            "mt-5 flex h-12 items-center justify-between px-4 type-label transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            added ? "bg-bone text-void" : "bg-volt text-bone hover:bg-arc hover:text-void",
          )}
        >
          {added ? "Agregado al carrito" : "Agregar mi combo al carrito"}
          {added ? <Check className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={1.5} />}
        </button>
      </aside>
    </div>
  );
}

/** Barra de progreso hacia el siguiente nivel de descuento. */
export function ComboProgress({ count, percent, next, className }: { count: number; percent: number; next: { percent: number; missing: number } | null; className?: string }) {
  const max = COMBO_TIERS.at(-1)!.minItems;
  return (
    <div className={className}>
      <p className="text-xs text-steel">
        {next ? (
          <>
            {percent > 0 && <span className="text-arc">Combo activo (hasta −{percent}%). </span>}
            Agrega <span className="text-bone">{next.missing === 1 ? "1 producto más" : `${next.missing} productos más`}</span> y tu descuento sube hasta −{next.percent}%.
          </>
        ) : (
          <span className="text-arc">¡Máximo descuento de combo activo: hasta −{percent}%!</span>
        )}
      </p>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={cn("h-1 flex-1 transition-colors duration-500", i < count ? "bg-arc shadow-[0_0_8px_rgba(0,168,255,0.7)]" : "bg-line-strong")} />
        ))}
      </div>
    </div>
  );
}
