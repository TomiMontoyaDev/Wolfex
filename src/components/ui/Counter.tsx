"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Número que sube al verse. Se pinta con el valor FINAL desde el HTML: si la animación no corre
 * (sin JS, capturas, buscadores) nunca muestra 0. Al entrar en pantalla anima desde el 60% del valor.
 */
export function Counter({ value, duration = 1.4, className }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

  useEffect(() => {
    if (!inView || !ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    const controls = animate(Math.round(value * 0.6), value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = Math.round(v).toString();
      },
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
