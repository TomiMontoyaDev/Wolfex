"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { formatPrice } from "@/lib/utils";

const SHOWN_KEY = "wfx_exit_shown";
const IDLE_MS = 45_000;
const MIN_TIME_MS = 4_000; // no salta apenas se abre la página
const AWAY_TITLE = "¡Tu carrito te espera! 🛒";

// sessionStorage puede fallar (modo privado / bloqueado): en ese caso solo se recuerda en memoria.
const readShown = () => {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
};
const markShown = () => {
  try {
    sessionStorage.setItem(SHOWN_KEY, "1");
  } catch {}
};

/**
 * Recordatorio de carrito: modal al intentar salir (computador: el mouse sale por arriba; celular: vuelve a la
 * pestaña o 45 s sin actividad) y título de la pestaña mientras está oculta. Máximo una vez por sesión,
 * nunca en el checkout ni con el carrito vacío.
 */
export function ExitIntent() {
  const router = useRouter();
  const pathname = usePathname();
  const { count, subtotal, isOpen: drawerOpen } = useCart();
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  const button = useRef<HTMLButtonElement>(null);

  const eligible = count > 0 && pathname !== "/checkout";
  // Lo último de cada valor, para leerlo dentro de los listeners sin re-suscribirlos.
  const state = useRef({ eligible, drawerOpen });
  useEffect(() => {
    state.current = { eligible, drawerOpen };
  }, [eligible, drawerOpen]);

  // Título de la pestaña mientras el cliente está en otra (solo si tiene algo en el carrito).
  useEffect(() => {
    if (count === 0) return;
    let original: string | null = null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        original = document.title;
        document.title = AWAY_TITLE;
      } else if (original !== null) {
        document.title = original;
        original = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (original !== null) document.title = original;
    };
  }, [count]);

  // Disparadores del modal.
  useEffect(() => {
    shown.current = readShown();
    if (shown.current) return;
    const mountedAt = Date.now();
    const touch = window.matchMedia("(pointer: coarse)").matches;

    const trigger = () => {
      const { eligible, drawerOpen } = state.current;
      if (shown.current || !eligible || drawerOpen || Date.now() - mountedAt < MIN_TIME_MS) return;
      shown.current = true;
      markShown();
      setOpen(true);
    };

    // Computador: el mouse sale de la ventana por arriba (hacia las pestañas o la barra de direcciones).
    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget && event.clientY <= 0) trigger();
    };

    // Celular: al volver a la pestaña después de salir.
    let wasHidden = false;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") wasHidden = true;
      else if (wasHidden) {
        wasHidden = false;
        trigger();
      }
    };

    // Celular: 45 s sin tocar, desplazar ni escribir.
    let idle: ReturnType<typeof setTimeout> | undefined;
    const resetIdle = () => {
      clearTimeout(idle);
      idle = setTimeout(trigger, IDLE_MS);
    };
    const activity = ["touchstart", "scroll", "keydown"] as const;

    if (touch) {
      document.addEventListener("visibilitychange", onVisibility);
      activity.forEach((type) => window.addEventListener(type, resetIdle, { passive: true }));
      resetIdle();
    } else {
      document.addEventListener("mouseout", onMouseOut);
    }
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", onVisibility);
      activity.forEach((type) => window.removeEventListener(type, resetIdle));
      clearTimeout(idle);
    };
  }, []);

  // Si el carrito queda vacío o entra al checkout con el modal abierto, se cierra.
  useEffect(() => {
    if (!eligible) setOpen(false);
  }, [eligible]);

  // Escape cierra y el foco va al botón principal.
  useEffect(() => {
    if (!open) return;
    button.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-void/75 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-intent-title"
            className="relative w-full max-w-md rounded-sm border border-volt/30 bg-ink p-6 text-center shadow-[0_30px_100px_-40px_rgba(0,102,255,0.9)] sm:p-8"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <button onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center text-steel transition-colors hover:text-bone">
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <p className="text-4xl" aria-hidden="true">🛒</p>
            <h2 id="exit-intent-title" className="mt-4 type-title text-xl leading-snug">
              Estás a un paso de complementar tu vida. Tu carrito te está esperando 🛒
            </h2>
            <p className="mt-3 text-sm text-steel">
              {count} {count === 1 ? "producto" : "productos"} · <span className="font-mono text-bone">{formatPrice(subtotal)}</span>
            </p>
            <button
              ref={button}
              onClick={() => {
                setOpen(false);
                router.push("/checkout");
              }}
              className="mt-6 h-14 w-full bg-volt type-title text-sm text-bone transition-shadow hover:shadow-[0_0_35px_rgba(0,102,255,0.38)]"
            >
              Finalizar mi compra
            </button>
            <button onClick={() => setOpen(false)} className="mt-3 type-label text-steel transition-colors hover:text-arc">
              Seguir mirando
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
