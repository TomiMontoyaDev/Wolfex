"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { formatPrice } from "@/lib/utils";

/** Dirección del último cambio (+1 sube, −1 baja) para animar el número hacia el lado correcto. */
function useDirection(value: number) {
  const previous = useRef(value);
  const direction = value >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = value;
  }, [value]);
  return direction;
}

/** Número que se desliza al cambiar (arriba al subir, abajo al bajar). Solo transform/opacity: liviano. */
function RollingValue({ value, children, className }: { value: number; children: ReactNode; className?: string }) {
  const direction = useDirection(value);
  return (
    <span className={`relative inline-flex overflow-hidden ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: direction * 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: direction * -12, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="inline-block"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Controles − cantidad + (bajar de 1 quita el producto). */
export function QuantityStepper({ value, label, onChange, max = 99 }: { value: number; label: string; onChange: (value: number) => void; max?: number }) {
  const buttonClass = "flex h-9 w-9 items-center justify-center text-steel transition-colors hover:text-arc active:scale-90 disabled:opacity-30";
  return (
    <div className="flex items-center border border-line-strong" role="group" aria-label={`Cantidad de ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label={value === 1 ? `Quitar ${label}` : `Quitar una unidad de ${label}`} className={buttonClass}>
        <Minus className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
      <RollingValue value={value} className="w-7 justify-center font-mono text-sm">
        <span aria-live="polite">{value}</span>
      </RollingValue>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Agregar una unidad de ${label}`} className={buttonClass}>
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}

/** Precio que se desliza al cambiar. */
export function AnimatedPrice({ value, className = "font-mono text-sm" }: { value: number; className?: string }) {
  return (
    <RollingValue value={value} className={className}>
      {formatPrice(value)}
    </RollingValue>
  );
}
