"use client";

import { ArrowUp, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/sections/FeaturedProducts";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Product, ProductCategory } from "@/data/products";
import { MAX_COMBO_PERCENT } from "@/lib/combo";
import { searchProducts } from "@/lib/search";
import { cn, formatPrice, pad } from "@/lib/utils";

const ALL = "TODAS";

const CATEGORY_LABELS: Record<string, string> = {
  SUPLEMENTOS: "Suplementos",
  PROTEINAS: "Proteínas",
  CREATINAS: "Creatinas",
  "PRE-ENTRENO": "Pre-entreno",
  "VITAMINAS Y BIENESTAR": "Vitaminas y bienestar",
  AMINOACIDOS: "Aminoácidos",
};

export function CatalogContent({ products, initialQuery = "", initialCategory }: { products: Product[]; initialQuery?: string; initialCategory?: string }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [brand, setBrand] = useState(ALL);
  const [category, setCategory] = useState<"TODAS" | ProductCategory>(() =>
    initialCategory && products.some((product) => product.category === initialCategory) ? (initialCategory as ProductCategory) : ALL,
  );
  const [maxPrice, setMaxPrice] = useState(Math.max(...products.map((product) => product.price)));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );
  const brands = useMemo(() => Array.from(new Set(products.map((product) => product.brand))).sort(), [products]);
  const priceCeiling = Math.max(...products.map((product) => product.price));
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        (brand === ALL || product.brand === brand) &&
        (category === ALL || product.category === category) &&
        product.price <= maxPrice,
    );
    // Con búsqueda activa, los resultados se ordenan por relevancia.
    return query.trim() ? searchProducts(filtered, query).results : filtered;
  }, [brand, category, maxPrice, products, query]);

  const resetFilters = () => {
    setQuery("");
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
            <h1 className="break-words type-display text-[clamp(2.2rem,9.5vw,8.5rem)] leading-[0.9]">{category === ALL ? "Catálogo" : CATEGORY_LABELS[category] ?? category}</h1>
            <p className="mt-6 max-w-xl type-body text-steel">
              {category === ALL
                ? "Explora todos nuestros suplementos. Filtra por marca, categoría y presupuesto."
                : `${filteredProducts.length} ${filteredProducts.length === 1 ? "producto" : "productos"} en ${(CATEGORY_LABELS[category] ?? category).toLowerCase()}. Filtra por marca y presupuesto, o elige otra categoría.`}
            </p>
            <a
              href="/#combos"
              className="group mt-6 inline-flex items-center gap-3 border border-arc/50 bg-arc/10 px-4 py-3 type-label text-bone transition-colors hover:border-arc hover:bg-arc hover:text-void"
            >
              <span className="bg-arc px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-void group-hover:bg-void group-hover:text-arc">COMBO</span>
              Arma tu combo y ahorra hasta {MAX_COMBO_PERCENT}%
              <span aria-hidden="true">→</span>
            </a>
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
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr_1.3fr_auto] md:items-end">
            <label className="block">
              <span className="type-label text-steel">Buscar</span>
              <span className="mt-3 flex items-center gap-2 border-b border-line-strong py-2 focus-within:border-arc">
                <Search className="h-4 w-4 shrink-0 text-steel" strokeWidth={1.5} aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Producto, marca…"
                  className="min-w-0 flex-1 bg-transparent type-label text-bone outline-none placeholder:text-steel/60"
                />
              </span>
            </label>
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
        <div className="container-wfx mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-5 md:mt-14 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14 xl:grid-cols-5">
          {/* 2 por fila en celular (antes 1 que ocupaba toda la pantalla), 3 en tablet, 4–5 en escritorio. */}
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} layout="grid" />
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
