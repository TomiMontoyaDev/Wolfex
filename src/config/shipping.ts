/**
 * Envíos: tarifas, mínimos para envío gratis y zonas. Editable aquí, en un solo lugar
 * (carrito, checkout, pedido y admin leen estas constantes). El envío se cobra dentro del pago.
 */
import { formatPrice } from "@/lib/utils";

/** Zona local (entrega propia). */
export const LOCAL_CITIES = ["Pereira", "Dosquebradas"] as const;
/** Ciudad con entrega el mismo día (productos en stock físico). */
export const LOCAL_CITY = "Pereira";
export const LOCAL_ZONE_LABEL = "Pereira y Dosquebradas";

/** Envío gratis desde este subtotal (con descuentos de combo ya aplicados), COP. */
export const FREE_SHIPPING_PEREIRA_MIN = 50_000;
export const FREE_SHIPPING_NATIONAL_MIN = 150_000;

/** Tarifa fija por debajo del mínimo, COP. */
export const SHIPPING_RATE_LOCAL = 5_000;
export const SHIPPING_RATE_NATIONAL = 14_900;

/** Recargo por peso: por encima de `includedKg`, `perKg` por cada kg adicional (aplica también con envío gratis). */
export const WEIGHT_SURCHARGE = { includedKg: 2, perKg: 5_000 } as const;

/** Departamentos sin pago en línea: el envío se cotiza por WhatsApp. */
export const QUOTE_ONLY_DEPARTMENTS = ["San Andrés y Providencia", "Amazonas", "Chocó", "Guainía", "Vaupés", "Vichada", "Putumayo"] as const;

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

export function isLocalCity(city?: string | null): boolean {
  return !!city && LOCAL_CITIES.some((local) => normalize(local) === normalize(city));
}

export function isQuoteOnlyDepartment(department?: string | null): boolean {
  return !!department && QUOTE_ONLY_DEPARTMENTS.some((item) => normalize(item) === normalize(department));
}

export type ShippingZone = "local" | "national" | "quote";

export function shippingZone(city?: string | null, department?: string | null): ShippingZone {
  if (isQuoteOnlyDepartment(department)) return "quote";
  return isLocalCity(city) ? "local" : "national";
}

/** Mínimo para envío gratis según la ciudad de entrega. */
export function freeShippingMin(city?: string | null): number {
  return isLocalCity(city) ? FREE_SHIPPING_PEREIRA_MIN : FREE_SHIPPING_NATIONAL_MIN;
}

export function hasFreeShipping(subtotal: number, city?: string | null): boolean {
  return subtotal >= freeShippingMin(city);
}

/** Recargo por peso del pedido completo. */
export function weightSurcharge(weightKg: number) {
  const extra = Math.ceil(Math.max(0, weightKg - WEIGHT_SURCHARGE.includedKg) - 1e-9);
  return extra * WEIGHT_SURCHARGE.perKg;
}

export interface ShippingQuote {
  zone: ShippingZone;
  /** Tarifa base (0 si aplica envío gratis). */
  base: number;
  surcharge: number;
  /** Total del envío; null = se cotiza por WhatsApp (zona especial). */
  cost: number | null;
  free: boolean;
}

/**
 * Costo del envío de un pedido. `subtotal` = productos menos descuento de combo.
 * Lo usan el carrito, el checkout y el servidor (que es quien cobra).
 */
export function quoteShipping({ subtotal, weightKg, city, department }: { subtotal: number; weightKg: number; city?: string | null; department?: string | null }): ShippingQuote {
  const zone = shippingZone(city, department);
  if (zone === "quote") return { zone, base: 0, surcharge: 0, cost: null, free: false };
  const free = hasFreeShipping(subtotal, city);
  const base = free ? 0 : zone === "local" ? SHIPPING_RATE_LOCAL : SHIPPING_RATE_NATIONAL;
  const surcharge = weightSurcharge(weightKg);
  return { zone, base, surcharge, cost: base + surcharge, free };
}

/** Etiqueta de entrega del producto: STOCK = en físico en Pereira (mismo día) · DROP = lo despacha el proveedor. */
export function deliveryLabel(delivery: "STOCK" | "DROP"): string {
  return delivery === "STOCK" ? `Entrega HOY en ${LOCAL_CITY}` : "Envío nacional";
}

export const SHIPPING_BAR_ITEMS = [
  `Envío GRATIS en ${LOCAL_ZONE_LABEL} desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)}`,
  `Nacional gratis desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}`,
  `Entrega HOY en ${LOCAL_CITY}`,
];

/** Resumen de tarifas para textos (envíos, FAQ, producto). */
export const SHIPPING_SUMMARY = `${LOCAL_ZONE_LABEL}: ${formatPrice(SHIPPING_RATE_LOCAL)} (gratis desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)}). Resto de Colombia: ${formatPrice(SHIPPING_RATE_NATIONAL)} (gratis desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}).`;
