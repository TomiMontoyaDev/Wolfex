"use client";

import { ArrowUp, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/sections/FeaturedProducts";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Product, ProductCategory } from "@/data/products";
import { cn, formatPrice, pad } from "@/lib/utils";

const ALL = "TODAS";

export function CatalogContent({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const [brand, setBrand] = useState(ALL);
  const [category, setCategory] = useState<"TODAS" | ProductCategory>(ALL);
  const [maxPrice, setMaxPrice] = useState(Math.max(...products.map((product) => product.price)));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );
  const brands = useMemo(() => Array.from(new Set(products.map((product) => product.brand))).sort(), [products]);
  const priceCeiling = Math.max(...products.map((product) => product.price));
  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (brand === ALL || product.brand === brand) &&
          (category === ALL || product.category === category) &&
          product.price <= maxPrice,
      ),
    [brand, category, maxPrice, products],
  );

  const resetFilters = () => {
    setBrand(ALL);
    setCategory(ALL);
    setMaxPrice(priceCeiling);
  };

  return (
    <main className="min-h-screen bg-void pb-24 pt-[calc(var(--nav-h)+3rem)] md:pt-[calc(var(--nav-h)+5rem)]">
      <div className="container-wfx">
        <SectionLabel index="02" label="Catálogo completo WOLFEX" meta={`${pad(filteredProducts.length)} resultados · COP`} />

        <div className="mt-12 flex flex-col gap-6 md:mt-16 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="type-display text-[clamp(3.5rem,11vw,10rem)] leading-[0.85]">Catálogo</h1>
            <p className="mt-6 max-w-xl type-body text-steel">
              Explora todos nuestros suplementos y accesorios. Filtra por marca, categoría y presupuesto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="inline-flex items-center gap-2 border border-line-strong px-4 py-3 type-label text-bone transition-colors hover:border-arc md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
            {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        <div className={cn("mt-12 border-y border-line-strong py-5", !filtersOpen && "hidden md:block")}>
          <div className="grid gap-6 md:grid-cols-[1fr_1fr_1.3fr_auto] md:items-end">
            <FilterSelect label="Marca" value={brand} onChange={(value) => setBrand(value)} options={[ALL, ...brands]} />
            <FilterSelect label="Categoría / tipo" value={category} onChange={(value) => setCategory(value as "TODAS" | ProductCategory)} options={[ALL, ...categories]} />
            <label className="block">
              <span className="type-label text-steel">Precio máximo</span>
              <input
                type="range"
                min={0}
                max={priceCeiling}
                step={1000}
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="mt-4 w-full accent-[#0066ff]"
              />
              <span className="mt-2 block font-mono text-sm text-bone">{formatPrice(maxPrice)}</span>
            </label>
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 type-label text-steel transition-colors hover:text-arc">
              <X className="h-4 w-4" strokeWidth={1.5} />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="container-wfx mt-14 grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        <div className="container-wfx mt-20 border border-line-strong p-12 text-center">
          <p className="type-title text-bone">No encontramos productos con esos filtros.</p>
          <button type="button" onClick={resetFilters} className="mt-5 type-label text-arc underline underline-offset-4">Limpiar filtros</button>
        </div>
      )}

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-arc bg-volt text-bone shadow-[0_0_24px_rgba(0,102,255,0.45)] transition-transform hover:-translate-y-1"
        aria-label="Volver al inicio del catálogo"
      >
        <ArrowUp className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </main>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="type-label text-steel">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 w-full border-b border-line-strong bg-transparent py-2 type-label text-bone outline-none focus:border-arc">
        {options.map((option) => <option key={option} value={option} className="bg-ink">{label === "Marca" && option === ALL ? "Todas las marcas" : option}</option>)}
      </select>
    </label>
  );
}
