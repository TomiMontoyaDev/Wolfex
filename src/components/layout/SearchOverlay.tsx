"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { Media } from "@/components/ui/Media";
import type { Product } from "@/data/products";
import { formatPrice } from "@/lib/utils";

const SUGGESTIONS = ["Creatina", "Proteína", "Pre-entreno", "Aminoácidos", "Vitaminas"];

/** Buscador del navbar: resultados en vivo + "ver todos" en /catalogo?q=… */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { add } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = (await response.json()) as { total: number; results: Product[] };
        setResults(data.results);
        setTotal(data.total);
        setError(false);
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  function goToCatalog(term: string) {
    onClose();
    router.push(term.trim() ? `/catalogo?q=${encodeURIComponent(term.trim())}` : "/catalogo");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    goToCatalog(query);
  }

  function addToCart(product: Product) {
    add(product);
    setAdded(product.id);
    setTimeout(() => setAdded((current) => (current === product.id ? null : current)), 1600);
  }

  const q = query.trim();

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <button type="button" aria-label="Cerrar búsqueda" onClick={onClose} className="absolute inset-0 bg-void/80 backdrop-blur-md" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar productos"
            className="relative border-b border-volt/20 bg-ink shadow-[0_40px_120px_-40px_rgba(0,102,255,0.6)]"
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            exit={{ y: -40 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="container-wfx pb-6 pt-5 md:pb-8 md:pt-8">
              <form onSubmit={submit} className="flex items-center gap-3 border-b border-line-strong pb-3 focus-within:border-arc md:gap-5 md:pb-4">
                <Search className="h-5 w-5 shrink-0 text-arc md:h-6 md:w-6" strokeWidth={1.5} aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar productos, marcas o categorías"
                  aria-label="Buscar productos"
                  enterKeyHint="search"
                  className="min-w-0 flex-1 bg-transparent type-title text-lg text-bone outline-none placeholder:text-steel/60 md:text-2xl"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="type-label text-steel hover:text-arc">
                    Limpiar
                  </button>
                )}
                <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center text-bone/80 hover:text-arc">
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </form>

              <div className="mt-5 max-h-[min(60vh,560px)] overflow-y-auto overscroll-contain" aria-live="polite">
                {q.length < 2 ? (
                  <div>
                    <p className="type-label text-steel">Búsquedas populares</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setQuery(suggestion)}
                          className="border border-line-strong px-4 py-2 type-label text-bone/85 transition-colors hover:border-arc hover:text-arc"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : error ? (
                  <p className="py-6 text-sm text-red-300">No pudimos buscar en este momento. Intenta de nuevo.</p>
                ) : loading && !results.length ? (
                  <ul className="space-y-3" aria-busy="true">
                    {Array.from({ length: 4 }, (_, i) => (
                      <li key={i} className="h-16 animate-pulse rounded-sm bg-graphite" />
                    ))}
                  </ul>
                ) : !results.length ? (
                  <div className="py-8 text-center">
                    <p className="type-title text-bone">Sin resultados para “{q}”</p>
                    <p className="mt-2 text-sm text-steel">Prueba con otra palabra, una marca o una categoría.</p>
                  </div>
                ) : (
                  <>
                    <p className="type-label text-steel">
                      {total} {total === 1 ? "resultado" : "resultados"}
                    </p>
                    <ul className="mt-3 divide-y divide-line">
                      {results.map((product) => (
                        <li key={product.id} className="flex items-center gap-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              router.push(`/producto/${product.handle}`);
                            }}
                            className="group flex min-w-0 flex-1 items-center gap-4 text-left"
                          >
                            <span className="relative h-16 w-14 shrink-0 overflow-hidden bg-void ring-1 ring-inset ring-line-strong">
                              <Media slot={product.images.primary} sizes="56px" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate type-title text-sm text-bone transition-colors group-hover:text-arc">{product.name}</span>
                              <span className="mt-1 block truncate type-label text-steel">
                                {[product.brand, product.category].filter(Boolean).join(" · ")}
                              </span>
                            </span>
                          </button>
                          <span className="hidden font-mono text-sm text-bone sm:block">{formatPrice(product.price)}</span>
                          {product.available ? (
                            <button
                              type="button"
                              onClick={() => addToCart(product)}
                              className="flex h-10 shrink-0 items-center gap-1.5 border border-volt/60 px-3 type-label text-bone transition-colors hover:bg-volt"
                              aria-label={`Agregar ${product.name} al carrito`}
                            >
                              {added === product.id ? <Check className="h-4 w-4" strokeWidth={2} /> : "+"}
                              <span className="hidden sm:inline">{added === product.id ? "Agregado" : "Agregar"}</span>
                            </button>
                          ) : (
                            <span className="shrink-0 type-label text-steel">Agotado</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => goToCatalog(q)}
                      className="group mt-4 flex w-full items-center justify-between border border-line-strong px-4 py-4 type-title text-xs text-bone transition-colors hover:border-arc"
                    >
                      Ver {total === 1 ? "el resultado" : `los ${total} resultados`} en el catálogo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
