"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { deliveryLabel } from "@/config/shipping";
import type { Product, ProductCategory } from "@/data/products";
import { visibleDiscount } from "@/lib/pricing";
import { cn, formatPrice, pad } from "@/lib/utils";

export function FeaturedProducts({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const [category, setCategory] = useState<"TODAS" | ProductCategory>("TODAS");
  const visibleProducts = category === "TODAS" ? products : products.filter((product) => product.category === category);
  const categories: Array<"TODAS" | ProductCategory> = ["TODAS", ...Array.from(new Set(products.map((product) => product.category)))];

  return (
    <section id="drop" className="relative bg-void pb-28 pt-8 md:pb-44" aria-labelledby="drop-title">
      <div className="container-wfx">
        <SectionLabel index="01" label="Catálogo WOLFEX" meta={`${pad(visibleProducts.length)} productos · COP`} />

        <div className="mt-12 flex flex-col gap-8 md:mt-16 md:flex-row md:items-end md:justify-between">
          <SplitReveal as="h2" text="Catálogo" className="type-display text-[clamp(2.4rem,11vw,9.5rem)]" />
          <Reveal delay={0.2} className="max-w-sm md:pb-3">
            <p className="type-body text-steel">
              Productos seleccionados para entrenar más fuerte. Elige una categoría para explorar el catálogo.
            </p>
            <a href="/catalogo" className="group mt-5 inline-flex items-center gap-2 type-title text-xs text-bone">
              <span className="border-b border-line-strong pb-1 transition-colors group-hover:border-arc">Ver catálogo completo</span>
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

      {/* Cuadrícula igual al catálogo: 2 por fila en celular, 3 en tablet, 4–5 en escritorio. */}
      <div className="container-wfx mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-5 md:mt-16 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14 xl:grid-cols-5">
        {visibleProducts.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} layout="grid" />
        ))}
      </div>
    </section>
  );
}

/**
 * Tarjeta de producto. `rail` = fila deslizable del inicio (ancho fijo, 2 visibles en celular);
 * `grid` = cuadrícula del catálogo (ocupa su celda).
 */
export function ProductCard({ product, index, layout = "rail" }: { product: Product; index: number; layout?: "rail" | "grid" }) {
  const { add } = useCart();
  const { t } = useLanguage();
  const [color, setColor] = useState(product.colors[0]);
  const [added, setAdded] = useState(false);
  // Cada producto tiene su página (tipo tienda): foto grande, cantidad, descripción y relacionados.
  const href = `/producto/${product.handle}`;
  const discount = visibleDiscount(product.price, product.compareAtPrice);

  const onAdd = () => {
    add(product, color.name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <motion.article
      className={cn(
        "group relative flex min-w-0 flex-col",
        layout === "rail" && "w-[42vw] max-w-[230px] shrink-0 snap-start sm:w-[30vw] lg:w-auto lg:max-w-none",
        layout === "rail" && index % 2 === 1 && "lg:mt-16",
      )}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, delay: (index % 4) * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2 type-label text-[0.58rem] sm:mb-3 sm:text-[0.65rem]">
        <span className="hidden shrink-0 text-steel sm:inline">{product.sku}</span>
        {product.badge ? (
          <span className={cn("truncate", product.badge === "AGOTADO" ? "text-red-400" : "text-bone/70")}>{t(product.badge)}</span>
        ) : product.delivery ? (
          <span className={cn("flex min-w-0 items-center gap-1.5", product.delivery === "STOCK" ? "text-arc" : "text-steel")}>
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", product.delivery === "STOCK" ? "bg-arc shadow-[0_0_8px_rgba(0,168,255,0.9)]" : "bg-steel")} aria-hidden="true" />
            <span className="truncate">{deliveryLabel(product.delivery)}</span>
          </span>
        ) : null}
      </div>

      {/* Image stage: cuadrada (antes 4:5) para que la foto no domine la tarjeta, sobre todo en celular. */}
      <div
        className="relative aspect-square overflow-hidden bg-ink shadow-[inset_0_0_0_1px_rgba(245,247,250,0.06)] transition-shadow duration-700 group-hover:shadow-[inset_0_0_0_1px_rgba(0,168,255,0.45),0_30px_80px_-30px_rgba(0,102,255,0.55)]"
        data-cursor="view"
        data-cursor-label="Ver más"
      >
        <Link href={href} aria-label={`Ver ${product.name}`} className="absolute inset-0 z-[1] cursor-pointer" />
        <div className="absolute inset-0 transition-[transform,opacity] duration-[1.2s] ease-[var(--ease-apex)] group-hover:scale-[1.06] group-hover:opacity-0">
          <Media slot={product.images.primary} sizes="(min-width:1280px) 20vw, (min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" />
        </div>
        <div className="absolute inset-0 scale-[1.12] opacity-0 transition-[transform,opacity] duration-[1.2s] ease-[var(--ease-apex)] group-hover:scale-100 group-hover:opacity-100">
          <Media slot={product.images.secondary} sizes="(min-width:1280px) 20vw, (min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" />
        </div>

        <span className="pointer-events-none absolute -bottom-2 -left-0.5 hidden type-display text-[4.5rem] leading-none text-outline opacity-50 transition-[transform,opacity] duration-700 group-hover:-translate-y-2 group-hover:opacity-100 sm:block lg:text-[5.5rem]">
          {pad(index + 1)}
        </span>

        {discount && (
          <span className="pointer-events-none absolute left-2 top-2 z-[2] bg-arc px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-void shadow-[0_0_18px_rgba(0,168,255,0.55)] sm:left-3 sm:top-3 sm:px-2 sm:py-1 sm:text-xs">
            -{discount}%
          </span>
        )}

        <span className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-arc/15 to-transparent transition-[left] duration-[1.4s] ease-[var(--ease-apex)] group-hover:left-[130%]" />
        </span>

        {/* Desktop add-to-cart: rises in on hover */}
        <div className="absolute inset-x-3 bottom-3 z-[2] hidden translate-y-[calc(100%+1rem)] transition-transform duration-500 ease-[var(--ease-apex)] group-hover:translate-y-0 lg:block">
          <AddButton added={added} onAdd={onAdd} disabled={!product.available} />
        </div>
      </div>

      {/* Meta: el precio va debajo del nombre (antes al lado), así nunca se sale de la tarjeta con nombres largos. */}
      <div className="mt-3 flex min-w-0 flex-1 flex-col sm:mt-4">
        <p className="truncate type-label text-[0.6rem] text-steel sm:text-[0.65rem]">{product.brand}</p>
        <h3 className="mt-1 line-clamp-3 break-words type-title text-[0.8rem] leading-snug transition-colors duration-500 group-hover:text-arc sm:text-sm lg:text-base">
          <Link href={href} className="text-left">
            {t(product.name)}
          </Link>
        </h3>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-mono">
          <span className={cn("text-sm sm:text-base", discount ? "text-arc" : undefined)}>{formatPrice(product.price)}</span>
          {discount && product.compareAtPrice && (
            <s className="text-[0.7rem] text-steel sm:text-xs" aria-label={`Precio público ${formatPrice(product.compareAtPrice)}`}>
              {formatPrice(product.compareAtPrice)}
            </s>
          )}
        </p>
        <Link
          href={href}
          className="group/more mt-2 inline-flex w-fit items-center gap-1 type-label text-[0.6rem] text-bone/80 transition-colors hover:text-arc sm:text-[0.65rem]"
          data-cursor="hover"
        >
          <span className="border-b border-line-strong pb-0.5 transition-colors group-hover/more:border-arc">Ver más</span>
          <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover/more:-translate-y-0.5 group-hover/more:translate-x-0.5" strokeWidth={1.5} />
        </Link>

        {/* Botón al final de la tarjeta (mt-auto): en una fila todos quedan alineados aunque los nombres midan distinto. */}
        <div className="mt-auto pt-3 lg:hidden">
          <AddButton added={added} onAdd={onAdd} disabled={!product.available} compact />
        </div>
      </div>

    </motion.article>
  );
}

function AddButton({ added, onAdd, disabled = false, compact = false }: { added: boolean; onAdd: () => void; disabled?: boolean; compact?: boolean }) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onAdd}
      disabled={disabled}
      className={cn(
        "relative flex w-full items-center justify-between overflow-hidden border border-line-strong type-label transition-colors",
        compact ? "h-10 gap-2 px-3 text-[0.6rem] sm:h-11 sm:px-4 sm:text-[0.65rem]" : "h-12 px-4",
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
          {/* En celular el texto corto ("Añadir") cabe en media pantalla sin cortarse. */}
          {compact ? (
            <>
              <span className="sm:hidden">{added ? "Agregado" : "Añadir"}</span>
              <span className="hidden sm:inline">{added ? t("Added to bag") : t("Add to cart")}</span>
            </>
          ) : added ? (
            t("Added to bag")
          ) : (
            t("Add to cart")
          )}
        </motion.span>
      </AnimatePresence>
      {added ? <Check className="h-4 w-4 shrink-0" strokeWidth={2} /> : <Plus className="h-4 w-4 shrink-0" strokeWidth={1.5} />}
    </button>
  );
}
