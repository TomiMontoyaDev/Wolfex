/**
 * Reglas de precio de WOLFEX con los costos reales de cada venta. Funciones puras: sirven en el admin,
 * en scripts y en el servidor. El costo (mayorista) solo se pasa como argumento; este módulo no lo lee ni lo expone.
 */

/** Comisión de Mercado Pago por cada pago en la página. */
export const PAYMENT_FEE = { percent: 0.0329, fixed: 800 } as const;
/** Recargo adicional de los productos en stock físico. */
export const STOCK_FEE = { percent: 0.0299, fixed: 900 } as const;
/** Envío que cobra el proveedor por kilo (productos sin stock propio). */
export const SHIPPING_PER_KG = 11_100;
/**
 * Bajo este precio el producto es un complemento: viaja dentro de pedidos más grandes (solo suma su peso)
 * o, comprado solo, no tiene envío gratis. Tampoco genera por sí solo las tarifas fijas por transacción.
 */
export const ADDON_MAX_PRICE = 50_000;
/** Margen neto mínimo después de TODOS los costos (mayorista, pasarela, recargo de stock y envío). */
export const MIN_NET_MARGIN = 0.15;
/** Margen neto objetivo cuando no hay precio de competencia. */
const TARGET_NET_MARGIN = 0.22;
/** Descuento mínimo frente al precio público para mostrar el tachado. */
export const MIN_VISIBLE_DISCOUNT = 0.05;

export interface CostProfile {
  /** Precio mayorista. */
  wholesale: number;
  /** STOCK = en físico (recargo de stock, sin envío del proveedor) · DROP = lo despacha el proveedor (envío por kilo). */
  fulfillment?: "STOCK" | "DROP" | null;
  /** Nombre del producto: de ahí sale el peso estimado (libras, gramos, servicios…). */
  name: string;
  category?: string | null;
}

/** Siguiente precio terminado en .900 igual o mayor que `value` (109.141 → 109.900). */
export function roundUpTo900(value: number): number {
  return Math.ceil((value - 900) / 1000) * 1000 + 900;
}

/** Precio terminado en .900 igual o menor que `value` (113.950 → 113.900). */
export function roundDownTo900(value: number): number {
  return Math.floor((value - 900) / 1000) * 1000 + 900;
}

/** Peso de envío estimado en kg (con empaque) a partir del nombre del producto. */
export function estimateWeightKg(name: string, category?: string | null): number {
  const n = name.toUpperCase().replace(",", ".");
  const num = (pattern: RegExp) => Number(n.match(pattern)?.[1] ?? NaN);
  const pounds = num(/(\d+(?:\.\d+)?)\s*LIBRAS?/);
  if (pounds) return pounds * 0.4536 * 1.08;
  const kilos = num(/(\d+(?:\.\d+)?)\s*KILOS?/);
  if (kilos) return kilos * 1.08;
  const grams = num(/(\d+)\s*GRAMOS/);
  const packs = num(/X\s?(\d+)\s*(?:SACHETS|SOBRES|UNIDADES)/) || num(/(\d+)\s*(?:UNIDADES DE )?SACHETS/) || num(/(\d+)\s*SOBRES/);
  if (packs) {
    const unitGrams = grams && grams < 100 ? grams : /PROTEIN CRISP|BAR/.test(n) ? 55 : /BIPRO|ISO|WHEY|BEST|PROTEIN|BEEF|GOURMET|ELITE/.test(n) ? 32 : 12;
    return ((packs * unitGrams) / 1000) * 1.2 + 0.05;
  }
  if (/^(SACHET|SOBRE|UNIDAD)\b/.test(n)) return 0.06;
  if (grams) return (grams / 1000) * 1.15;
  const ml = num(/(\d+)\s*MILILITROS/);
  if (ml) return (ml / 1000) * 1.1;
  const oz = num(/(\d+)\s*ONZAS/);
  if (oz) return oz * 0.0296 * 1.15;
  if (/CAPSULAS|PERLAS|TABLETAS|SOFT?GELS|UNIDADES/.test(n)) return 0.3;
  const servings = num(/(\d+)\s*(?:SERVICIOS|SERVICOS|PORCIONES)/);
  if (servings) {
    const perServing =
      category === "CREATINAS" || /CREATIN|CREA|CR7|ATOMIC|LEGACY|HCL|GLUTAMIN|BETA|CITRULL|CRE4/.test(n) ? 5 : category === "PROTEINAS" || /PROTEIN|WHEY|ISO|GAINER|MASS/.test(n) ? 32 : 11;
    return ((servings * perServing) / 1000) * 1.2;
  }
  return 1;
}

/** Costos de vender una unidad a `price`: porcentaje sobre el precio, fijos y envío. */
export function saleCosts(price: number, product: CostProfile) {
  const stock = product.fulfillment === "STOCK";
  const addon = price < ADDON_MAX_PRICE;
  const kg = estimateWeightKg(product.name, product.category);
  return {
    percent: PAYMENT_FEE.percent + (stock ? STOCK_FEE.percent : 0),
    fixed: addon ? 0 : PAYMENT_FEE.fixed + (stock ? STOCK_FEE.fixed : 0),
    // Producto principal: kilo iniciado (tolerancia 100 g). Complemento: solo el peso que agrega al paquete.
    shipping: stock ? 0 : addon ? Math.round(kg * SHIPPING_PER_KG) : Math.max(1, Math.ceil(kg - 0.1)) * SHIPPING_PER_KG,
  };
}

/** Margen neto real: lo que queda después de mayorista, pasarela, recargo de stock y envío. */
export function netMargin(price: number, product: CostProfile): number {
  const costs = saleCosts(price, product);
  return (price - product.wholesale - price * costs.percent - costs.fixed - costs.shipping) / price;
}

/** Precio exacto (sin redondear) que deja `margin` neto. */
export function breakEvenPrice(product: CostProfile, margin: number): number {
  const solve = (price: number) => {
    const costs = saleCosts(price, product);
    return (product.wholesale + costs.fixed + costs.shipping) / (1 - costs.percent - margin);
  };
  // Si como producto principal queda bajo el umbral, se recalcula como complemento.
  const asMain = solve(ADDON_MAX_PRICE);
  return asMain >= ADDON_MAX_PRICE ? asMain : solve(0);
}

/** Precio más bajo permitido (15% neto real), terminado en .900. */
export function minPrice(product: CostProfile): number {
  return roundUpTo900(breakEvenPrice(product, MIN_NET_MARGIN));
}

/**
 * Precio sugerido. Con competidor: su precio − $100, bajado a .900 para no quedar por encima de él.
 * Sin competidor: el que deja 22% neto real. Nunca por debajo de `minPrice`.
 */
export function suggestPrice(product: CostProfile, competitorPrice?: number): number {
  const floor = minPrice(product);
  const target = competitorPrice ? roundDownTo900(competitorPrice - 100) : roundUpTo900(breakEvenPrice(product, TARGET_NET_MARGIN));
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
