"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";

export interface CartLine {
  key: string;
  product: Product;
  color: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (product: Product, color?: string) => void;
  remove: (key: string) => void;
  /** Bumps on every add — lets the navbar badge animate. */
  pulse: number;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);

  const add = useCallback((product: Product, color = product.colors[0]?.name ?? "Default") => {
    const key = `${product.id}:${color}`;
    setLines((prev) => {
      const hit = prev.find((l) => l.key === key);
      if (hit) return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { key, product, color, quantity: 1 }];
    });
    setPulse((p) => p + 1);
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);

  const value = useMemo<CartState>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((n, l) => n + l.quantity * l.product.price, 0);
    return { lines, count, subtotal, isOpen, open: () => setOpen(true), close: () => setOpen(false), add, remove, pulse };
  }, [lines, isOpen, add, remove, pulse]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
