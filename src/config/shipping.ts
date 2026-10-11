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

/**
 * Envío gratis desde este subtotal (productos con el descuento de combo ya aplicado), COP.
 * Pereira/Dosquebradas: 50.000 si TODO el pedido es de stock propio (entrega HOY); 120.000 si trae algo bajo pedido.
 */
export const FREE_SHIPPING_PEREIRA_MIN = 50_000;
export const FREE_SHIPPING_PEREIRA_MIXED_MIN = 120_000;
export const FREE_SHIPPING_NATIONAL_MIN = 150_000;
/** Pedidos nacionales con algún producto pesado (`heavy`): gratis solo desde aquí; por debajo se suma el recargo. */
export const FREE_SHIPPING_HEAVY_MIN = 250_000;
/** Recargo fijo por peso (envío nacional con producto pesado, bajo FREE_SHIPPING_HEAVY_MIN). */
export const HEAVY_SURCHARGE = 9_900;

/** Tarifa fija por debajo del mínimo, COP. */
export const SHIPPING_RATE_LOCAL = 5_000;
export const SHIPPING_RATE_NATIONAL = 14_900;

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

/** Lo que del carrito cambia el envío: si todo es de stock propio y si hay algún producto pesado. */
export interface CartShippingProfile {
  allStock: boolean;
  heavy: boolean;
}

export function cartShippingProfile(items: Array<{ delivery?: "STOCK" | "DROP" | null; heavy?: boolean | null }>): CartShippingProfile {
  return {
    allStock: items.length > 0 && items.every((item) => item.delivery === "STOCK"),
    heavy: items.some((item) => item.heavy),
  };
}

/** Subtotal desde el que el envío queda en $0 para esa zona y ese carrito. */
export function freeShippingMin(zone: "local" | "national", profile: CartShippingProfile): number {
  if (zone === "local") return profile.allStock ? FREE_SHIPPING_PEREIRA_MIN : FREE_SHIPPING_PEREIRA_MIXED_MIN;
  return profile.heavy ? FREE_SHIPPING_HEAVY_MIN : FREE_SHIPPING_NATIONAL_MIN;
}

export interface ShippingQuote {
  zone: ShippingZone;
  /** Tarifa base (0 si alcanza el mínimo de su zona). */
  base: number;
  /** Recargo por peso (producto pesado, envío nacional). */
  surcharge: number;
  /** Total del envío; null = se cotiza por WhatsApp (zona especial). */
  cost: number | null;
  /** Envío en $0. */
  free: boolean;
  /** Subtotal para tener el envío en $0 (null en zonas a cotizar). */
  freeMin: number | null;
}

/**
 * Costo del envío de un pedido. `subtotal` = productos menos descuento de combo (así el combo nunca
 * "regala" además el envío gratis si con el descuento queda bajo el mínimo).
 * Lo usan el carrito, el checkout y el servidor (que es quien cobra).
 */
export function quoteShipping({ subtotal, city, department, profile }: { subtotal: number; city?: string | null; department?: string | null; profile: CartShippingProfile }): ShippingQuote {
  const zone = shippingZone(city, department);
  if (zone === "quote") return { zone, base: 0, surcharge: 0, cost: null, free: false, freeMin: null };
  if (zone === "local") {
    const freeMin = freeShippingMin("local", profile);
    const base = subtotal >= freeMin ? 0 : SHIPPING_RATE_LOCAL;
    return { zone, base, surcharge: 0, cost: base, free: base === 0, freeMin };
  }
  const base = subtotal >= FREE_SHIPPING_NATIONAL_MIN ? 0 : SHIPPING_RATE_NATIONAL;
  const surcharge = profile.heavy && subtotal < FREE_SHIPPING_HEAVY_MIN ? HEAVY_SURCHARGE : 0;
  return { zone, base, surcharge, cost: base + surcharge, free: base + surcharge === 0, freeMin: freeShippingMin("national", profile) };
}

/** Etiqueta de entrega del producto: STOCK = en físico en Pereira (mismo día) · DROP = lo despacha el proveedor. */
export function deliveryLabel(delivery: "STOCK" | "DROP"): string {
  return delivery === "STOCK" ? `Entrega HOY en ${LOCAL_CITY}` : "Envío nacional";
}

/** Frase corta del envío gratis (hero, banners, ficha). */
export const FREE_SHIPPING_LINE = `Envío GRATIS: ${LOCAL_CITY} desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)} (productos con entrega hoy) · Colombia desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}`;

export const SHIPPING_BAR_ITEMS = [
  `Envío GRATIS en ${LOCAL_CITY} desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)} (productos con entrega hoy)`,
  `Envío GRATIS a toda Colombia desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}`,
  `Entrega HOY en ${LOCAL_CITY}`,
];

/** Las reglas completas, una por línea (página de envíos y preguntas frecuentes). */
export const SHIPPING_RULES = [
  `${LOCAL_ZONE_LABEL}: ${formatPrice(SHIPPING_RATE_LOCAL)}. Gratis desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)} si todo tu pedido es de entrega HOY, o desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIXED_MIN)} si incluye productos bajo pedido.`,
  `Resto de Colombia: ${formatPrice(SHIPPING_RATE_NATIONAL)}. Gratis desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}.`,
  `Productos pesados (5 libras o más, creatinas de 1 kg o de 200+ servicios): el envío nacional es gratis desde ${formatPrice(FREE_SHIPPING_HEAVY_MIN)}; por debajo se suma un recargo por peso de ${formatPrice(HEAVY_SURCHARGE)}.`,
];

/** Resumen de tarifas para textos (envíos, FAQ, producto). */
export const SHIPPING_SUMMARY = SHIPPING_RULES.join(" ");
