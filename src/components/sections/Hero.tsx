"use client";

import { ShieldCheck, Truck, Zap } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { WolfMark, Wordmark } from "@/components/visuals/WolfMark";
import { FREE_SHIPPING_PEREIRA_MIN, LOCAL_CITY } from "@/config/shipping";
import { formatPrice } from "@/lib/utils";

/**
 * Hero orientado a vender: marca + oferta concreta + "Comprar ahora". Se pinta completo desde el primer
 * HTML (sin animación de entrada que lo oculte) y en celular deja ver los más vendidos en el primer scroll.
 */
export function Hero() {
  const perks = [
    { icon: Zap, text: `Entrega HOY en ${LOCAL_CITY}` },
    { icon: Truck, text: `Envío gratis desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)}` },
    { icon: ShieldCheck, text: "Pago seguro" },
  ];

  return (
    <section id="top" className="relative overflow-hidden bg-void pt-[calc(var(--nav-h)+var(--bar-h))]" aria-labelledby="hero-title">
      {/* Atmósfera (solo CSS: sin JS ni canvas) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-[38%] h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,102,255,0.28)_0%,rgba(6,21,47,0.55)_35%,rgba(5,5,5,0)_70%)]" />
        <div className="absolute inset-0 bg-tech-grid opacity-50 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-void to-transparent" />
      </div>

      <div className="container-wfx relative flex flex-col items-center justify-center py-6 text-center md:min-h-[78svh] md:py-16">
        <WolfMark className="h-11 w-auto text-bone drop-shadow-[0_0_30px_rgba(0,102,255,0.45)] md:h-24" />
        <h1 id="hero-title" className="mt-3 w-full md:mt-6">
          <span className="sr-only">WOLFEX — suplementos deportivos originales en Colombia</span>
          <Wordmark className="mx-auto block h-auto w-[min(88vw,980px)] text-bone drop-shadow-[0_0_40px_rgba(0,102,255,0.28)]" title="" />
        </h1>
        <p className="mt-3 max-w-xl type-title md:mt-5 text-[clamp(1.05rem,3.6vw,1.6rem)] leading-snug text-bone">
          Suplementos originales para entrenar más fuerte
        </p>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-steel">
          {perks.map((perk) => (
            <li key={perk.text} className="flex items-center gap-1.5">
              <perk.icon className="h-4 w-4 text-arc" strokeWidth={1.75} aria-hidden="true" />
              {perk.text}
            </li>
          ))}
        </ul>
        <div className="mt-5 grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:gap-3 md:mt-7">
          <MagneticButton href="/catalogo" className="w-full sm:w-auto [&>a]:w-full [&>a]:px-3">
            Comprar ahora
          </MagneticButton>
          <MagneticButton href="#combos" variant="ghost" arrow={false} className="w-full sm:w-auto [&>a]:w-full [&>a]:px-3">
            Ver combos
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
