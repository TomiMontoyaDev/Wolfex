/**
 * Envío gratis: editable aquí, en un solo lugar (tienda, carrito, checkout y admin leen estas constantes).
 * Por debajo del mínimo el envío no se cobra en línea: se cobra aparte según producto y localidad.
 */
import { formatPrice } from "@/lib/utils";

/** Envíos dentro de Pereira: gratis desde este subtotal (COP). */
export const FREE_SHIPPING_PEREIRA_MIN = 50_000;
/**
 * Resto de Colombia: gratis desde este subtotal (COP). Los precios de los productos de envío nacional
 * ya incluyen el costo estimado del envío por kilo (ver src/lib/pricing.ts).
 */
export const FREE_SHIPPING_NATIONAL_MIN = 120_000;

/** Ciudad con entrega local (mismo día para productos en stock físico). */
export const LOCAL_CITY = "Pereira";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

export function isLocalCity(city?: string | null): boolean {
  return !!city && normalize(city) === normalize(LOCAL_CITY);
}

/** Mínimo para envío gratis según la ciudad de entrega. */
export function freeShippingMin(city?: string | null): number {
  return isLocalCity(city) ? FREE_SHIPPING_PEREIRA_MIN : FREE_SHIPPING_NATIONAL_MIN;
}

export function hasFreeShipping(subtotal: number, city?: string | null): boolean {
  return subtotal >= freeShippingMin(city);
}

/** Etiqueta de entrega del producto: STOCK = en físico en Pereira (mismo día) · DROP = lo despacha el proveedor. */
export function deliveryLabel(delivery: "STOCK" | "DROP"): string {
  return delivery === "STOCK" ? `Entrega HOY en ${LOCAL_CITY}` : "Envío nacional";
}

export const SHIPPING_BAR_ITEMS = [
  `Envío GRATIS en ${LOCAL_CITY} desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)}`,
  `Nacional gratis desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}`,
  `Entrega HOY en ${LOCAL_CITY}`,
];
