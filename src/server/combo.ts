import "server-only";
import { unstable_cache } from "next/cache";
import { COMBO_MIN_ITEM_PRICE, COMBO_MIN_NET_MARGIN, RECOMMENDED_COMBOS } from "@/config/combos";
import type { Product } from "@/data/products";
import { comboItemCount, comboTier, linePercent, nextComboTier } from "@/lib/combo";
import { getCatalogProducts, PRODUCTS_TAG } from "@/lib/commerce";
import { breakEvenPrice, MIN_NET_MARGIN, type CostProfile } from "@/lib/pricing";
import { db } from "./db";

/**
 * Descuento por combo. El servidor es la única fuente de verdad: usa el costo (que nunca sale de aquí)
 * para que ningún producto baje del margen neto mínimo. Lo usan la cotización en vivo y la creación del pedido.
 */

export interface ComboLineInput {
  productId: string;
  quantity: number;
}

export interface ComboResult {
  /** Productos distintos que cuentan para el combo. */
  count: number;
  /** Porcentaje del nivel alcanzado (tope "hasta"); 0 si no hay combo. */
  percent: number;
  /** Descuento total en COP (suma de descuentos por unidad × cantidad). */
  discount: number;
  /** Descuento por unidad de cada producto (entero, múltiplo de $100). */
  unitDiscounts: Map<string, number>;
  /** true si alguna proteína de 2 lb o más recibió menos que el nivel del combo (tope de 5%). */
  capped: boolean;
  next: { percent: number; missing: number } | null;
}

/**
 * Precio más bajo que deja el margen neto mínimo del combo, con los costos reales de la venta
 * (pasarela, recargo de stock y envío). Nunca menor que la regla general de la tienda.
 */
const floorPrice = (product: CostProfile) => Math.ceil(breakEvenPrice(product, Math.max(MIN_NET_MARGIN, COMBO_MIN_NET_MARGIN)));
const profileOf = (product: { costPrice: number | null; fulfillment: "STOCK" | "DROP" | null; name: string; category: string | null }): CostProfile | null =>
  product.costPrice === null ? null : { wholesale: product.costPrice, fulfillment: product.fulfillment, name: product.name, category: product.category };
const toHundreds = (value: number) => Math.floor(value / 100) * 100;

export async function computeCombo(lines: ComboLineInput[]): Promise<ComboResult> {
  const ids = [...new Set(lines.map((line) => line.productId))];
  const products = ids.length
    ? await db.product.findMany({
        where: { id: { in: ids }, active: true },
        select: { id: true, price: true, costPrice: true, fulfillment: true, name: true, category: true },
      })
    : [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const priced = lines.flatMap((line) => {
    const product = byId.get(line.productId);
    return product ? [{ ...line, price: product.price, profile: profileOf(product) }] : [];
  });

  const count = comboItemCount(priced);
  const tier = comboTier(count);
  const next = nextComboTier(count);
  const unitDiscounts = new Map<string, number>();
  let discount = 0;

  let capped = false;
  if (tier) {
    for (const line of priced) {
      if (line.price < COMBO_MIN_ITEM_PRICE || !line.profile || unitDiscounts.has(line.productId)) continue;
      // Proteínas de 2 lb o más: cuentan para el nivel, pero su descuento llega como máximo al 5%.
      const percent = linePercent(tier.percent, line.profile);
      if (percent < tier.percent) capped = true;
      // Tope por margen: el descuento nunca deja el producto por debajo del 15% neto real.
      const unit = Math.max(0, Math.min(toHundreds((line.price * percent) / 100), toHundreds(line.price - floorPrice(line.profile))));
      unitDiscounts.set(line.productId, unit);
    }
    for (const line of priced) discount += (unitDiscounts.get(line.productId) ?? 0) * line.quantity;
  }

  return { count, percent: tier?.percent ?? 0, discount, unitDiscounts, capped, next: next ? { percent: next.tier.percent, missing: next.missing } : null };
}

/** Datos públicos de una cotización (lo que ve el navegador: sin costos ni topes por margen). */
export function publicQuote(result: ComboResult) {
  return { count: result.count, percent: result.percent, discount: result.discount, capped: result.capped, next: result.next };
}

/**
 * Sugerencias para completar el combo: productos con margen para el descuento, de categorías que el
 * cliente aún no tiene, primero los de entrega inmediata en Pereira.
 */
export const getComboSuggestionPool = unstable_cache(
  async () => {
    const withRoom = await db.product.findMany({
      where: { active: true, lowPriority: false, price: { gte: COMBO_MIN_ITEM_PRICE }, costPrice: { not: null }, OR: [{ stock: null }, { stock: { gt: 0 } }] },
      select: { id: true, price: true, costPrice: true, fulfillment: true, name: true, category: true },
    });
    // Aguanta el 10% completo sin bajar del margen mínimo real.
    return withRoom.filter((product) => product.price * 0.9 >= floorPrice(profileOf(product)!)).map((product) => product.id);
  },
  ["combo-suggestion-pool", "v3"],
  { tags: [PRODUCTS_TAG], revalidate: 3600 },
);

export async function comboSuggestions(cartProductIds: string[], limit = 3): Promise<Product[]> {
  const [catalog, pool] = await Promise.all([getCatalogProducts(), getComboSuggestionPool()]);
  const allowed = new Set(pool);
  const inCart = new Set(cartProductIds);
  const cartCategories = new Set(catalog.filter((product) => inCart.has(product.id)).map((product) => product.category));
  const candidates = catalog.filter((product) => allowed.has(product.id) && !inCart.has(product.id) && product.available);
  const picked: Product[] = [];
  const usedCategories = new Set(cartCategories);
  // Una sugerencia por categoría nueva, priorizando stock en Pereira y luego el orden de la tienda.
  const ranked = [...candidates].sort((a, b) => Number(b.delivery === "STOCK") - Number(a.delivery === "STOCK"));
  for (const product of ranked) {
    if (picked.length >= limit) break;
    if (usedCategories.has(product.category)) continue;
    usedCategories.add(product.category);
    picked.push(product);
  }
  for (const product of ranked) {
    if (picked.length >= limit) break;
    if (!picked.includes(product)) picked.push(product);
  }
  return picked;
}

export interface RecommendedComboView {
  id: string;
  name: string;
  goal: string;
  description: string;
  products: Product[];
  subtotal: number;
  discount: number;
  total: number;
  percent: number;
}

/** Combos recomendados con su precio real de combo (se ocultan si algún producto no está disponible). */
export const getRecommendedCombos = unstable_cache(
  async (): Promise<RecommendedComboView[]> => {
    const catalog = await getCatalogProducts();
    const bySku = new Map(catalog.map((product) => [product.sku, product]));
    const views: RecommendedComboView[] = [];
    for (const combo of RECOMMENDED_COMBOS) {
      const products = combo.skus.map((sku) => bySku.get(sku));
      if (products.some((product) => !product?.available)) continue;
      const list = products as Product[];
      const result = await computeCombo(list.map((product) => ({ productId: product.id, quantity: 1 })));
      const subtotal = list.reduce((sum, product) => sum + product.price, 0);
      views.push({ id: combo.id, name: combo.name, goal: combo.goal, description: combo.description, products: list, subtotal, discount: result.discount, total: subtotal - result.discount, percent: result.percent });
    }
    return views;
  },
  ["recommended-combos", "v5"],
  { tags: [PRODUCTS_TAG], revalidate: 3600 },
);

/** Opciones del armador: por categoría, productos que cuentan para el combo, en el orden de la tienda. */
export async function getBuilderOptions(categoriesBySlot: ReadonlyArray<{ id: string; categories: readonly string[] }>, perSlot = 8) {
  const catalog = (await getCatalogProducts()).filter((product) => product.available && product.price >= COMBO_MIN_ITEM_PRICE);
  return Object.fromEntries(
    categoriesBySlot.map((slot) => [slot.id, catalog.filter((product) => slot.categories.includes(product.category)).slice(0, perSlot)]),
  ) as Record<string, Product[]>;
}
