"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import type { Product, ProductCategory } from "@/data/products";
import { cn, formatPrice, pad } from "@/lib/utils";

export function FeaturedProducts({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [category, setCategory] = useState<"TODAS" | ProductCategory>("TODAS");
  const visibleProducts = category === "TODAS" ? products : products.filter((product) => product.category === category);
  const categories: Array<"TODAS" | ProductCategory> = ["TODAS", ...Array.from(new Set(products.map((product) => product.category)))];

  const onRailScroll = () => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;
    setActive(Math.round(el.scrollLeft / (card.offsetWidth + 16)));
  };

  return (
    <section id="drop" className="relative bg-void pb-28 pt-8 md:pb-44" aria-labelledby="drop-title">
      <div className="container-wfx">
        <SectionLabel index="02" label="Catálogo · Power Nutrition" meta={`${pad(visibleProducts.length)} productos · COP`} />

        <div className="mt-12 flex flex-col gap-8 md:mt-16 md:flex-row md:items-end md:justify-between">
          <SplitReveal as="h2" text="Catálogo" className="type-display text-[clamp(3.25rem,10vw,9.5rem)]" />
          <Reveal delay={0.2} className="max-w-sm md:pb-3">
            <p className="type-body text-steel">
              Productos seleccionados para entrenar más fuerte. Elige una categoría para explorar el catálogo.
            </p>
            <a href="#" className="group mt-5 inline-flex items-center gap-2 type-title text-xs text-bone">
              <span className="border-b border-line-strong pb-1 transition-colors group-hover:border-arc">{t("Shop all")}</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
            </a>
          </Reveal>
        </div>

        <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Categorías del catálogo">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              onClick={() => {
                setCategory(item);
                setActive(0);
              }}
              className={cn(
                "border px-4 py-3 type-label transition-colors",
                category === item ? "border-arc bg-arc text-void" : "border-line-strong text-steel hover:border-arc hover:text-bone",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: swipe rail. Desktop: staggered editorial row. */}
      <div
        ref={rail}
        onScroll={onRailScroll}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] md:mt-20 lg:container-wfx lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible"
      >
        {visibleProducts.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>

      <div className="container-wfx mt-8 flex items-center gap-4 lg:hidden">
        <span className="type-label text-bone">{pad(active + 1)}</span>
        <span className="relative h-px flex-1 bg-line-strong">
          <motion.span
            className="absolute inset-y-0 left-0 bg-arc"
            animate={{ width: `${((active + 1) / visibleProducts.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </span>
        <span className="type-label text-steel">{pad(visibleProducts.length)}</span>
      </div>
    </section>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { add } = useCart();
  const { t } = useLanguage();
  const [color, setColor] = useState(product.colors[0]);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add(product, color.name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <motion.article
      className={cn("group relative w-[82vw] max-w-[380px] shrink-0 snap-start sm:w-[46vw] lg:w-auto lg:max-w-none", index % 2 === 1 && "lg:mt-24")}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, delay: (index % 4) * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-3 flex items-center justify-between type-label">
        <span className="text-steel">{product.sku}</span>
        {product.badge && (
          <span className={cn(product.badge === "AGOTADO" ? "text-red-400" : "text-bone/70")}>{t(product.badge)}</span>
        )}
      </div>

      {/* Image stage */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-ink shadow-[inset_0_0_0_1px_rgba(245,247,250,0.06)] transition-shadow duration-700 group-hover:shadow-[inset_0_0_0_1px_rgba(0,168,255,0.45),0_30px_80px_-30px_rgba(0,102,255,0.55)]"
        data-cursor="view"
        data-cursor-label="View"
      >
        <div className="absolute inset-0 transition-[transform,opacity] duration-[1.2s] ease-[var(--ease-apex)] group-hover:scale-[1.06] group-hover:opacity-0">
          <Media slot={product.images.primary} sizes="(min-width:1024px) 25vw, 82vw" />
        </div>
        <div className="absolute inset-0 scale-[1.12] opacity-0 transition-[transform,opacity] duration-[1.2s] ease-[var(--ease-apex)] group-hover:scale-100 group-hover:opacity-100">
          <Media slot={product.images.secondary} sizes="(min-width:1024px) 25vw, 82vw" />
        </div>

        <span className="pointer-events-none absolute -bottom-4 -left-1 type-display text-[7rem] leading-none text-outline opacity-60 transition-[transform,opacity] duration-700 group-hover:-translate-y-2 group-hover:opacity-100 md:text-[8rem]">
          {pad(index + 1)}
        </span>

        <span className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-arc/15 to-transparent transition-[left] duration-[1.4s] ease-[var(--ease-apex)] group-hover:left-[130%]" />
        </span>

        {/* Desktop add-to-cart: rises in on hover */}
        <div className="absolute inset-x-3 bottom-3 hidden translate-y-[calc(100%+1rem)] transition-transform duration-500 ease-[var(--ease-apex)] group-hover:translate-y-0 lg:block">
          <AddButton added={added} onAdd={onAdd} disabled={!product.available} />
        </div>
      </div>

      {/* Meta */}
      <div className="mt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="transition-transform duration-500 ease-[var(--ease-apex)] group-hover:translate-x-1.5">
            <p className="type-label text-steel">WOLFEX</p>
            <h3 className="mt-1 type-title text-lg leading-tight transition-colors duration-500 group-hover:text-arc">{t(product.name)}</h3>
          </div>
          <p className="pt-4 font-mono text-sm">{formatPrice(product.price)}</p>
        </div>
        <p className="mt-2 text-sm text-steel">{t(product.descriptor)}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Color">
            {product.colors.map((c) => (
              <button
                key={c.name}
                role="radio"
                aria-checked={c.name === color.name}
                aria-label={c.name}
                onClick={() => setColor(c)}
                className={cn(
                  "h-4 w-4 rounded-full border transition-[box-shadow,border-color] duration-300",
                  c.name === color.name ? "border-arc shadow-[0_0_0_3px_#050505,0_0_0_4px_rgba(0,168,255,0.7)]" : "border-line-strong",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <span className="ml-2 type-label text-steel">{color.name}</span>
          </div>
          <span className="hidden type-label text-steel/70 xl:block">{product.spec}</span>
        </div>

        <div className="mt-5 lg:hidden">
          <AddButton added={added} onAdd={onAdd} disabled={!product.available} />
        </div>
      </div>
    </motion.article>
  );
}

function AddButton({ added, onAdd, disabled = false }: { added: boolean; onAdd: () => void; disabled?: boolean }) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onAdd}
      disabled={disabled}
      className={cn(
        "relative flex h-12 w-full items-center justify-between overflow-hidden border border-line-strong px-4 type-label transition-colors",
        disabled
          ? "cursor-not-allowed text-steel"
          : added
            ? "bg-bone text-void"
            : "bg-void/80 text-bone backdrop-blur-md hover:border-arc hover:bg-volt",
      )}
      data-cursor="hover"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={added ? "a" : "b"} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.25 }}>
          {added ? t("Added to bag") : t("Add to cart")}
        </motion.span>
      </AnimatePresence>
      {added ? <Check className="h-4 w-4" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={1.5} />}
    </button>
  );
}
