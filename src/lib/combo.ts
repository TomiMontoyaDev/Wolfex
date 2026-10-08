import { COMBO_LARGE_PROTEIN, COMBO_MIN_ITEM_PRICE, COMBO_TIERS } from "@/config/combos";

/** Reglas públicas del combo (sin costos): sirven en la tienda y en el servidor. */

export type ComboTier = (typeof COMBO_TIERS)[number];

/** Productos distintos que cuentan para el combo (precio ≥ mínimo). Repetir el mismo producto no suma. */
export function comboItemCount(lines: Array<{ productId: string; price: number }>) {
  return new Set(lines.filter((line) => line.price >= COMBO_MIN_ITEM_PRICE).map((line) => line.productId)).size;
}

export function comboTier(count: number): ComboTier | null {
  return [...COMBO_TIERS].reverse().find((tier) => count >= tier.minItems) ?? null;
}

/** Siguiente nivel alcanzable y cuántos productos faltan para llegar. */
export function nextComboTier(count: number): { tier: ComboTier; missing: number } | null {
  const tier = COMBO_TIERS.find((item) => count < item.minItems);
  return tier ? { tier, missing: tier.minItems - count } : null;
}

/** Nivel del combo calculado al instante en el navegador (el monto del descuento lo da el servidor). */
export function comboStatus(lines: Array<{ productId: string; price: number }>) {
  const count = comboItemCount(lines);
  const next = nextComboTier(count);
  return { count, percent: comboTier(count)?.percent ?? 0, next: next ? { percent: next.tier.percent, missing: next.missing } : null };
}

/** Presentación en libras leída del nombre ("2 LIBRAS", "3.26 LIBRAS", "1 KILO", "908 GRAMOS"); null si no la indica. */
export function presentationPounds(name: string): number | null {
  const n = name.toUpperCase().replace(",", ".");
  const pounds = n.match(/(\d+(?:\.\d+)?)\s*LIBRAS?\b/);
  if (pounds) return Number(pounds[1]);
  const kilos = n.match(/(\d+(?:\.\d+)?)\s*(?:KILOS?|KG)\b/);
  if (kilos) return Number(kilos[1]) * 2.20462;
  const grams = n.match(/(\d+)\s*(?:GRAMOS|GR?)\b/);
  return grams ? Number(grams[1]) / 453.592 : null;
}

/** Proteína de 2 lb o más (incluye ganadores de masa): descuento de combo con tope (COMBO_LARGE_PROTEIN). */
export function isLargeProtein(product: { name: string; category?: string | null }) {
  // 1,99 lb por redondeos de gramos (908 g = 2 lb).
  return product.category === COMBO_LARGE_PROTEIN.category && (presentationPounds(product.name) ?? 0) >= COMBO_LARGE_PROTEIN.minPounds - 0.01;
}

/** Porcentaje que recibe un producto dentro de un combo del nivel `percent`. */
export function linePercent(percent: number, product: { name: string; category?: string | null }) {
  return isLargeProtein(product) ? Math.min(percent, COMBO_LARGE_PROTEIN.maxPercent) : percent;
}

export const MAX_COMBO_PERCENT = Math.max(...COMBO_TIERS.map((tier) => tier.percent));
