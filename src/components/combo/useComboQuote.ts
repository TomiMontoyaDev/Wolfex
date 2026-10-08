"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";

export interface ComboQuote {
  count: number;
  percent: number;
  discount: number;
  /** Alguna proteína de 2 lb o más quedó con el tope de 5%. */
  capped: boolean;
  next: { percent: number; missing: number } | null;
  suggestions: Product[];
}

const EMPTY: ComboQuote = { count: 0, percent: 0, discount: 0, capped: false, next: { percent: 5, missing: 2 }, suggestions: [] };

/** Cotiza el combo en el servidor cada vez que cambian los productos (con una pequeña espera para agrupar cambios). */
export function useComboQuote(lines: Array<{ productId: string; quantity: number }>, { suggest = false } = {}) {
  const key = useMemo(() => JSON.stringify(lines.map((line) => [line.productId, line.quantity])), [lines]);
  const [quote, setQuote] = useState<ComboQuote>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const parsed = JSON.parse(key) as Array<[string, number]>;
    if (!parsed.length) {
      setQuote(EMPTY);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/combo/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines: parsed.map(([productId, quantity]) => ({ productId, quantity })), suggest }),
          signal: controller.signal,
        });
        if (response.ok) setQuote(await response.json());
      } catch {
        // Sin cotización se muestra el precio normal; el pedido calcula el descuento real igual.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [key, suggest]);

  return { quote, loading };
}
