"use client";

import { motion } from "framer-motion";
import { ArrowRight, Flame, Package, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/sections/FeaturedProducts";
import { FREE_SHIPPING_NATIONAL_MIN, FREE_SHIPPING_PEREIRA_MIN, LOCAL_CITY } from "@/config/shipping";
import type { Product } from "@/data/products";
import { MAX_COMBO_PERCENT } from "@/lib/combo";
import { cn, formatPrice } from "@/lib/utils";
import type { RecommendedComboView } from "@/server/combo";

const LABELS: Record<string, string> = {
  PROTEINAS: "Proteínas",
  CREATINAS: "Creatinas",
  "PRE-ENTRENO": "Pre-entreno",
  SUPLEMENTOS: "Suplementos",
  "VITAMINAS Y BIENESTAR": "Vitaminas",
  AMINOACIDOS: "Aminoácidos",
};

function NeonHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[#ffd84a]">{eyebrow}</p>
      <h2 id={id} className="mt-2 type-display italic text-[clamp(2rem,6vw,4rem)] leading-[0.9] text-white [text-shadow:0_0_24px_rgba(255,46,136,0.65)]">
        {title}
      </h2>
    </div>
  );
}

/** Catálogo de la promo: ofertas WOLFEX VI, combos con su ahorro y todo lo que tiene descuento, con filtro por categoría. */
export function PromoCatalog({ deals, discounted, combos }: { deals: Product[]; discounted: Product[]; combos: RecommendedComboView[] }) {
  const [category, setCategory] = useState("TODAS");
  const categories = useMemo(() => ["TODAS", ...Array.from(new Set(discounted.map((product) => product.category)))], [discounted]);
  const shown = category === "TODAS" ? discounted : discounted.filter((product) => product.category === category);

  return (
    <div className="relative pb-24">
      {/* Beneficios vigentes */}
      <div className="container-wfx grid gap-2.5 py-10 sm:grid-cols-3">
        {[
          { icon: Flame, title: `Ofertas WOLFEX VI`, text: "Precios rebajados en productos seleccionados" },
          { icon: Package, title: `Combos hasta −${MAX_COMBO_PERCENT}%`, text: "Entre más productos distintos, más ahorras" },
          { icon: Truck, title: "Envío GRATIS", text: `${LOCAL_CITY} desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)} · Colombia desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}` },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 border border-[#ff2e88]/35 bg-white/[0.03] p-4">
            <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#ff2e88]" strokeWidth={1.75} />
            <div>
              <p className="type-title text-sm text-white">{item.title}</p>
              <p className="mt-0.5 text-xs text-white/65">{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ofertas WOLFEX VI */}
      {deals.length > 0 && (
        <section id="ofertas" className="container-wfx scroll-mt-28 py-10" aria-labelledby="deals-title">
          <NeonHeading eyebrow="Edición limitada" title="Ofertas WOLFEX VI" id="deals-title" />
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {deals.map((product, index) => (
              <div key={product.id} className="relative rounded-sm p-[1px] [background:linear-gradient(135deg,#ff2e88,#ff8a3d,#00e1ff)]">
                <div className="h-full bg-[#0b0016] p-2 sm:p-3">
                  <ProductCard product={product} index={index} layout="grid" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Combos recomendados con su ahorro */}
      {combos.length > 0 && (
        <section className="container-wfx py-10" aria-labelledby="combos-title">
          <NeonHeading eyebrow={`Ahorra hasta −${MAX_COMBO_PERCENT}%`} title="Combos de la nueva era" id="combos-title" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {combos.map((combo, i) => (
              <motion.a
                key={combo.id}
                href="/#combos"
                className="group flex flex-col border border-white/12 bg-white/[0.03] p-5 transition-colors hover:border-[#00e1ff]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
              >
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#00e1ff]">{combo.goal}</p>
                <p className="mt-1 type-title text-base text-white">{combo.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-white/60">{combo.products.map((product) => product.name).join(" + ")}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    {combo.discount > 0 && <s className="block font-mono text-xs text-white/50">{formatPrice(combo.subtotal)}</s>}
                    <span className="font-mono text-xl text-white">{formatPrice(combo.total)}</span>
                  </div>
                  {combo.discount > 0 && <span className="bg-[#ffd84a] px-2 py-1 font-mono text-xs font-semibold text-black">Ahorras {formatPrice(combo.discount)}</span>}
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 type-label text-[0.62rem] text-white/80 group-hover:text-[#00e1ff]">
                  Armar este combo <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </motion.a>
            ))}
          </div>
        </section>
      )}

      {/* Todo lo que tiene descuento */}
      {discounted.length > 0 && (
        <section className="container-wfx py-10" aria-labelledby="all-title">
          <NeonHeading eyebrow={`${discounted.length} productos`} title="Todos los descuentos" id="all-title" />
          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoría">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={category === item}
                onClick={() => setCategory(item)}
                className={cn(
                  "border px-4 py-2.5 type-label text-[0.65rem] transition-colors",
                  category === item ? "border-[#ff2e88] bg-[#ff2e88] text-white" : "border-white/20 text-white/70 hover:border-[#ff2e88] hover:text-white",
                )}
              >
                {item === "TODAS" ? "Todas" : LABELS[item] ?? item}
              </button>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {shown.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} layout="grid" />
            ))}
          </div>
        </section>
      )}

      <div className="container-wfx pt-6 text-center">
        <a href="/catalogo" className="inline-flex items-center gap-2 border border-white/25 px-6 py-4 type-title text-sm text-white transition-colors hover:border-[#00e1ff] hover:text-[#00e1ff]">
          Ver todo el catálogo <ArrowRight className="h-4 w-4" />
        </a>
        <p className="mx-auto mt-4 max-w-md text-[0.7rem] text-white/45">
          Precios en pesos colombianos (COP). Descuentos de combo aplicados automáticamente en el carrito. Ofertas sujetas a disponibilidad.
        </p>
      </div>
    </div>
  );
}
