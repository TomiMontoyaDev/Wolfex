import { COMBO_MIN_ITEM_PRICE, COMBO_TIERS } from "@/config/combos";

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

export const MAX_COMBO_PERCENT = Math.max(...COMBO_TIERS.map((tier) => tier.percent));
