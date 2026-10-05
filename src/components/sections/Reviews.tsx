"use client";

import { BadgeCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { cn, pad } from "@/lib/utils";
import type { PublicReview } from "@/server/reviews";

const AUTOPLAY_MS = 5500;
const GAP = "1.5rem";

/** Tarjetas visibles según el ancho: 1 en móvil, 2 en tablet, 3 en escritorio. */
function usePerView() {
  const [perView, setPerView] = useState(1);
  useEffect(() => {
    const md = window.matchMedia("(min-width: 640px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const update = () => setPerView(lg.matches ? 3 : md.matches ? 2 : 1);
    update();
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);
  return perView;
}

/** Reseñas aprobadas: carrusel con avance automático, botones, puntos y arrastre táctil. */
export function Reviews({ reviews }: { reviews: PublicReview[] }) {
  const perView = usePerView();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dragStart = useRef<number | null>(null);

  const positions = Math.max(1, reviews.length - perView + 1);
  const controls = reviews.length > perView;
  const go = useCallback((next: number) => setIndex(((next % positions) + positions) % positions), [positions]);

  useEffect(() => setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  // Si cambia el ancho y sobran posiciones, se ajusta el índice.
  useEffect(() => setIndex((current) => Math.min(current, positions - 1)), [positions]);

  useEffect(() => {
    if (!controls || paused || reducedMotion) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") setIndex((current) => (current + 1) % positions);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [controls, paused, reducedMotion, positions]);

  if (!reviews.length) return null;

  const onPointerDown = (event: PointerEvent) => {
    dragStart.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1));
  };

  return (
    <section className="relative overflow-hidden bg-void py-24 md:py-36" aria-label="Reseñas">
      <div className="container-wfx">
        <SectionLabel index="05" label="Reseñas" meta={`${pad(reviews.length)} opiniones`} />

        <div className="mt-12 flex flex-col gap-8 md:mt-16 md:flex-row md:items-end md:justify-between">
          <SplitReveal as="h2" text="La manada opina" className="type-display text-[clamp(2.75rem,8vw,7.5rem)]" />
          {controls && (
            <Reveal delay={0.2} className="flex items-center gap-2">
              <NavButton label="Reseña anterior" onClick={() => go(index - 1)}>
                <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
              </NavButton>
              <NavButton label="Reseña siguiente" onClick={() => go(index + 1)}>
                <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
              </NavButton>
            </Reveal>
          )}
        </div>

        <div
          className="mt-12 overflow-hidden md:mt-16"
          role="region"
          aria-roledescription="carrusel"
          aria-label="Reseñas de clientes"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <ul
            className="flex touch-pan-y select-none transition-transform duration-700 ease-[var(--ease-apex)]"
            style={{ gap: GAP, transform: `translateX(calc(${-index} * (100% + ${GAP}) / ${perView}))` }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={() => (dragStart.current = null)}
            aria-live={paused || reducedMotion ? "polite" : "off"}
          >
            {reviews.map((review, i) => (
              <li
                key={review.id}
                className="shrink-0"
                style={{ flexBasis: `calc((100% - (${perView} - 1) * ${GAP}) / ${perView})` }}
                role="group"
                aria-roledescription="reseña"
                aria-label={`${i + 1} de ${reviews.length}`}
                aria-hidden={i < index || i >= index + perView}
              >
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        </div>

        {controls && (
          <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label="Elegir reseñas">
            {Array.from({ length: positions }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir a la posición ${i + 1}`}
                onClick={() => go(i)}
                className={cn("h-1.5 rounded-full transition-all duration-500", i === index ? "w-8 bg-arc shadow-[0_0_10px_rgba(0,168,255,0.8)]" : "w-1.5 bg-line-strong hover:bg-steel")}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <article className="flex h-full flex-col border border-line-strong bg-ink p-6 transition-colors duration-500 hover:border-arc/50 md:p-8">
      <div className="flex items-center gap-1" aria-label={`${review.rating} de 5 estrellas`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-arc text-arc" : "text-line-strong")} strokeWidth={1.5} aria-hidden="true" />
        ))}
      </div>
      <p className="mt-5 flex-1 text-[0.95rem] leading-relaxed text-bone/90">“{review.body}”</p>
      {review.productName && <p className="mt-5 type-label text-steel">Producto: {review.productName}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div>
          <p className="type-title text-sm text-bone">{review.authorName}</p>
          {review.city && <p className="mt-0.5 type-label text-steel">{review.city}</p>}
        </div>
        {review.verified ? (
          <span className="flex items-center gap-1.5 type-label text-arc">
            <BadgeCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> Compra verificada
          </span>
        ) : review.label ? (
          <span className="border border-line-strong px-2 py-1 type-label text-steel">{review.label}</span>
        ) : null}
      </div>
    </article>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-12 w-12 items-center justify-center border border-line-strong text-bone transition-colors hover:border-arc hover:bg-volt"
      data-cursor="hover"
    >
      {children}
    </button>
  );
}
