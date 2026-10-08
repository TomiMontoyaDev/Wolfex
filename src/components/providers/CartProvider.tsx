"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { flyToCart } from "@/lib/fly-to-cart";
import { track } from "@/lib/meta-pixel";

export interface CartLine {
  key: string;
  product: Product;
  color: string;
  quantity: number;
}

export interface AddOptions {
  /** Abre el carrito cuando la animación llega al ícono (por defecto sí; no en el checkout). */
  open?: boolean;
}

const MAX_QUANTITY = 99;

interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (product: Product, color?: string, options?: AddOptions) => void;
  remove: (key: string) => void;
  /** Cambia la cantidad de una línea (0 la quita). */
  setQuantity: (key: string, quantity: number) => void;
  /** Bumps on every add — lets the navbar badge animate. */
  pulse: number;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  const add = useCallback((product: Product, color = product.colors[0]?.name ?? "Default", options: AddOptions = {}) => {
    const key = `${product.id}:${color}`;
    setLines((prev) => {
      const hit = prev.find((l) => l.key === key);
      if (hit) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + 1) } : l));
      return [...prev, { key, product, color, quantity: 1 }];
    });
    setPulse((p) => p + 1);
    // Cada clic en "Agregar al carrito" suma 1 unidad.
    track("AddToCart", { contents: [{ id: product.sku, quantity: 1, item_price: product.price }] });

    // La miniatura vuela al ícono y, al llegar, se abre el carrito (varios agregados seguidos: una sola apertura).
    const flight = flyToCart(product.images.primary.src);
    if (options.open !== false) {
      clearTimeout(openTimer.current);
      openTimer.current = setTimeout(() => setOpen(true), flight);
    }
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    const line = linesRef.current.find((l) => l.key === key);
    if (!line) return;
    const next = Math.max(0, Math.min(MAX_QUANTITY, Math.round(quantity)));
    // Subir la cantidad también es agregar al carrito (para Meta).
    if (next > line.quantity) track("AddToCart", { contents: [{ id: line.product.sku, quantity: next - line.quantity, item_price: line.product.price }] });
    setLines((prev) => (next === 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: next } : l))));
  }, []);

  const value = useMemo<CartState>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((n, l) => n + l.quantity * l.product.price, 0);
    return { lines, count, subtotal, isOpen, open: () => setOpen(true), close: () => setOpen(false), add, remove, setQuantity, pulse };
  }, [lines, isOpen, add, remove, setQuantity, pulse]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
