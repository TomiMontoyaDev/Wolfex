"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LOOSE_ITEM_MESSAGE, hasAnchorItem, isLooseItem } from "@/config/cart";
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
  /** Unidades a agregar (por defecto 1). */
  quantity?: number;
}

const MAX_QUANTITY = 99;

interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Agrega al carrito. false = no se agregó (producto suelto sin un producto principal en el carrito). */
  add: (product: Product, color?: string, options?: AddOptions) => boolean;
  /** Hay productos sueltos sin un producto principal que los acompañe (el pago los rechaza). */
  looseWithoutAnchor: boolean;
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
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  const add = useCallback((product: Product, color = product.colors[0]?.name ?? "Default", options: AddOptions = {}) => {
    // Sobres, latas y barras sueltas: solo junto a un producto principal.
    if (isLooseItem(product.price) && !hasAnchorItem(linesRef.current.map((line) => line.product.price))) {
      setNotice(LOOSE_ITEM_MESSAGE);
      clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(null), 4500);
      return false;
    }
    const key = `${product.id}:${color}`;
    const units = Math.max(1, Math.min(MAX_QUANTITY, Math.round(options.quantity ?? 1)));
    setLines((prev) => {
      const hit = prev.find((l) => l.key === key);
      if (hit) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + units) } : l));
      return [...prev, { key, product, color, quantity: units }];
    });
    setPulse((p) => p + 1);
    // Cada clic en "Agregar al carrito" suma las unidades elegidas (1 por defecto).
    track("AddToCart", { contents: [{ id: product.sku, quantity: units, item_price: product.price }] });

    // La miniatura vuela al ícono y, al llegar, se abre el carrito (varios agregados seguidos: una sola apertura).
    const flight = flyToCart(product.images.primary.src);
    if (options.open !== false) {
      clearTimeout(openTimer.current);
      openTimer.current = setTimeout(() => setOpen(true), flight);
    }
    return true;
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
    const prices = lines.map((l) => l.product.price);
    const looseWithoutAnchor = prices.some(isLooseItem) && !hasAnchorItem(prices);
    return { lines, count, subtotal, isOpen, open: () => setOpen(true), close: () => setOpen(false), add, remove, setQuantity, pulse, looseWithoutAnchor };
  }, [lines, isOpen, add, remove, setQuantity, pulse]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {notice && (
        <p role="status" className="fixed inset-x-4 bottom-24 z-[120] mx-auto max-w-sm border border-arc/60 bg-void/95 px-4 py-3 text-center text-sm text-bone shadow-[0_0_30px_-8px_rgba(0,168,255,0.7)] backdrop-blur-md">
          {notice}
        </p>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
