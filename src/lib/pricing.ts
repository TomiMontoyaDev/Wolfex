/**
 * Reglas de precio de WOLFEX. Funciones puras: sirven en el admin, en scripts y en la tienda.
 * El costo (mayorista) solo se pasa como argumento; este módulo no lo lee ni lo expone.
 */

/** Comisión de la pasarela de pago que asume la tienda. */
export const GATEWAY_FEE = 0.035;
/** Margen neto mínimo después de la comisión. */
export const MIN_NET_MARGIN = 0.15;
/** Margen bruto objetivo cuando no hay precio de competencia (mayorista / 0,77). */
const TARGET_COST_RATIO = 0.77;
/** Descuento mínimo frente al precio público para mostrar el tachado. */
export const MIN_VISIBLE_DISCOUNT = 0.05;

/** Siguiente precio terminado en .900 igual o mayor que `value` (109.141 → 109.900). */
export function roundUpTo900(value: number): number {
  return Math.ceil((value - 900) / 1000) * 1000 + 900;
}

/** Precio terminado en .900 igual o menor que `value` (113.950 → 113.900). */
export function roundDownTo900(value: number): number {
  return Math.floor((value - 900) / 1000) * 1000 + 900;
}

/** Margen neto: (precio − mayorista) / precio − comisión de pasarela. */
export function netMargin(price: number, wholesale: number): number {
  return (price - wholesale) / price - GATEWAY_FEE;
}

/** Precio más bajo permitido: deja al menos 15% neto (mayorista / 0,815), terminado en .900. */
export function minPrice(wholesale: number): number {
  return roundUpTo900(wholesale / (1 - GATEWAY_FEE - MIN_NET_MARGIN));
}

/**
 * Precio sugerido. Con competidor: su precio − $100, bajado a .900 para no quedar por encima de él.
 * Sin competidor: mayorista / 0,77. Nunca por debajo de `minPrice`.
 */
export function suggestPrice(wholesale: number, competitorPrice?: number): number {
  const floor = minPrice(wholesale);
  const target = competitorPrice ? roundDownTo900(competitorPrice - 100) : roundUpTo900(wholesale / TARGET_COST_RATIO);
  return Math.max(target, floor);
}

/**
 * Descuento a mostrar frente al precio público del proveedor (precio tachado).
 * Menos de 5% no se muestra: un tachado casi igual al precio se ve pobre.
 */
export function visibleDiscount(price: number, compareAtPrice?: number | null): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  const discount = 1 - price / compareAtPrice;
  // Hacia abajo (nunca anunciar más descuento del real); el epsilon evita que 0,29 × 100 = 28,999… dé 28.
  return discount >= MIN_VISIBLE_DISCOUNT ? Math.floor(discount * 100 + 1e-9) : null;
}
