"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { FREE_SHIPPING_NATIONAL_MIN, FREE_SHIPPING_PEREIRA_MIN, LOCAL_CITY } from "@/config/shipping";
import { MAX_COMBO_PERCENT } from "@/lib/combo";
import { trackCustom } from "@/lib/meta-pixel";
import { whatsappLink } from "@/lib/site-config";
import { formatPrice } from "@/lib/utils";

const SEEN_KEY = "wfx_goal_seen";
const DELAY_MS = 9_000;

const GOALS = [
  { emoji: "💪", label: "Ganar masa muscular", hint: "Proteínas y ganadores", href: "/catalogo?categoria=proteinas" },
  { emoji: "🏋️", label: "Más fuerza y rendimiento", hint: "Creatinas", href: "/catalogo?categoria=creatinas" },
  { emoji: "⚡", label: "Energía para entrenar", hint: "Pre-entrenos", href: "/catalogo?categoria=pre-entreno" },
  { emoji: "❤️", label: "Salud y bienestar", hint: "Vitaminas, omega 3, magnesio", href: "/catalogo?categoria=vitaminas-y-bienestar" },
] as const;

const seen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // sin almacenamiento no se puede recordar: mejor no molestar
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {}
};

/**
 * "¿Qué quieres lograr?": a quien entra por primera vez al inicio le muestra, una sola vez, un atajo a los
 * productos de su objetivo y los beneficios reales de la tienda. Sale a los 9 s o al bajar más allá del hero;
 * nunca con productos en el carrito (ahí actúa el recordatorio de carrito).
 */
export function GoalFinder() {
  const router = useRouter();
  const pathname = usePathname();
  const { count, isOpen: drawerOpen } = useCart();
  const [open, setOpen] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  const state = useRef({ count, drawerOpen });
  useEffect(() => {
    state.current = { count, drawerOpen };
  }, [count, drawerOpen]);

  useEffect(() => {
    if (pathname !== "/" || seen()) return;
    let done = false;
    const show = () => {
      if (done || state.current.count > 0 || state.current.drawerOpen || document.querySelector('[role="dialog"]')) return;
      done = true;
      markSeen();
      setOpen(true);
      trackCustom("GoalFinderShown");
    };
    const timer = setTimeout(show, DELAY_MS);
    const onScroll = () => window.scrollY > window.innerHeight * 1.2 && show();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (href: string, goal: string) => {
    trackCustom("GoalFinderPick", { goal });
    setOpen(false);
    if (href.startsWith("#")) document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    else router.push(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-void/75 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-title"
            className="relative max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-sm border border-volt/30 bg-ink p-5 shadow-[0_30px_100px_-40px_rgba(0,102,255,0.9)] sm:p-8"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center text-steel transition-colors hover:text-bone">
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <p className="type-label text-arc">Encuentra tu suplemento</p>
            <h2 id="goal-title" className="mt-2 pr-8 type-title text-2xl leading-tight text-bone">¿Qué quieres lograr?</h2>
            <p className="mt-1 text-sm text-steel">Toca tu objetivo y te mostramos lo indicado.</p>

            <div className="mt-5 grid gap-2.5">
              {GOALS.map((goal, index) => (
                <button
                  key={goal.label}
                  ref={index === 0 ? first : undefined}
                  type="button"
                  onClick={() => go(goal.href, goal.label)}
                  className="group flex items-center gap-4 border border-line-strong px-4 py-3 text-left transition-colors hover:border-arc hover:bg-arc/10"
                >
                  <span className="text-2xl" aria-hidden="true">{goal.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block type-title text-sm text-bone">{goal.label}</span>
                    <span className="block text-xs text-steel">{goal.hint}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-steel transition-transform group-hover:translate-x-1 group-hover:text-arc" strokeWidth={1.5} />
                </button>
              ))}
              <button
                type="button"
                onClick={() => go("#combos", "combo")}
                className="flex items-center justify-between gap-3 bg-volt px-4 py-3.5 text-left type-title text-sm text-bone transition-shadow hover:shadow-[0_0_30px_rgba(0,102,255,0.45)]"
              >
                <span>🎯 Arma tu combo y ahorra hasta −{MAX_COMBO_PERCENT}%</span>
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              </button>
            </div>

            <ul className="mt-5 grid gap-1.5 border-t border-line pt-4 text-xs text-steel">
              <li>🚚 Envío GRATIS en {LOCAL_CITY} desde {formatPrice(FREE_SHIPPING_PEREIRA_MIN)} · nacional desde {formatPrice(FREE_SHIPPING_NATIONAL_MIN)}</li>
              <li>⚡ Entrega HOY en {LOCAL_CITY} en productos seleccionados</li>
              <li>🔒 Pago seguro con Mercado Pago</li>
            </ul>
            <a
              href={whatsappLink("Hola WOLFEX, quiero asesoría para elegir mis suplementos")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackCustom("GoalFinderWhatsApp");
                setOpen(false);
              }}
              className="mt-4 block text-center type-label text-steel underline-offset-4 transition-colors hover:text-arc hover:underline"
            >
              ¿No sabes cuál? Asesoría gratis por WhatsApp
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
