"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_COMBO_PERCENT } from "@/lib/combo";
import { NEON_PROMO } from "@/config/promo";
import { FREE_SHIPPING_NATIONAL_MIN } from "@/config/shipping";
import { trackCustom } from "@/lib/meta-pixel";
import { formatPrice } from "@/lib/utils";
import { GlitchTitle } from "./NeonPromo";
import { NeonScene, WantedStars } from "./NeonScene";

/** Marca de sesión: si el pop-up neón ya salió, el "¿Qué quieres lograr?" espera a otra visita. */
export const NEON_SESSION_KEY = "wfx_neon_shown";
const DELAY_MS = 4_000;

/** Pop-up de la campaña: una vez por sesión en el inicio, a los 4 s. Lleva a "Arma tu combo". */
export function NeonPromoModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cta = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!NEON_PROMO.active || pathname !== "/") return;
    try {
      if (sessionStorage.getItem(NEON_SESSION_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => {
      if (document.querySelector('[role="dialog"]')) return;
      try {
        sessionStorage.setItem(NEON_SESSION_KEY, "1");
      } catch {}
      setOpen(true);
      trackCustom("NeonPromoShown");
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    cta.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="neon-modal-title"
            className="relative w-full max-w-md overflow-hidden border-2 border-[#ff2e88] shadow-[0_0_60px_rgba(255,46,136,0.55)]"
            // Entrada tipo "pantalla de carga": se abre en vertical con un destello.
            initial={{ scaleY: 0.02, scaleX: 0.6, opacity: 0 }}
            animate={{ scaleY: 1, scaleX: 1, opacity: 1 }}
            exit={{ scaleY: 0.02, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[min(78svh,560px)]">
              <NeonScene compact />
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center text-white/80 hover:text-white">
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <div className="relative z-10 flex h-full flex-col items-center px-6 pt-10 text-center">
                <motion.p
                  className="bg-black/50 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[#ffd84a]"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ● Nueva misión disponible
                </motion.p>
                <h2 id="neon-modal-title" className="mt-4 type-display italic leading-[0.85] text-[clamp(3rem,15vw,4.6rem)]">
                  <GlitchTitle text={NEON_PROMO.title} />
                </h2>
                <p className="mt-1 bg-black/45 px-2 py-0.5 font-mono text-xs uppercase tracking-[0.45em] text-[#00e1ff] [text-shadow:0_0_10px_rgba(0,225,255,0.9)]">{NEON_PROMO.subtitle}</p>
                <div className="mt-6 flex items-center gap-2 bg-black/50 px-3 py-2 backdrop-blur-sm">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/70">Nivel de ahorro</span>
                  <WantedStars lit={3} />
                </div>
                <p className="mt-4 max-w-[19rem] bg-black/55 px-3 py-2 text-sm text-white backdrop-blur-sm">
                  Arma tu combo y ahorra <b className="text-[#ffd84a]">hasta −{MAX_COMBO_PERCENT}%</b> + envío GRATIS desde {formatPrice(FREE_SHIPPING_NATIONAL_MIN)}
                </p>
                <a
                  ref={cta}
                  href="#nueva-era"
                  onClick={() => {
                    trackCustom("NeonPromoClick", { place: "modal" });
                    setOpen(false);
                  }}
                  className="mt-auto mb-[24%] inline-flex items-center gap-2 bg-[linear-gradient(90deg,#ff2e88,#ff8a3d)] px-5 py-3.5 type-title text-sm text-white shadow-[0_0_35px_rgba(255,46,136,0.7)]"
                >
                  Aceptar misión <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
