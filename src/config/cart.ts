/**
 * Productos sueltos (sobres, latas, barras): por su precio no pagan el envío solos, así que se venden
 * solo junto a un producto principal. Editable aquí; lo aplican el carrito y el servidor.
 */

/** Bajo este precio el producto es "suelto". */
export const LOOSE_ITEM_MAX_PRICE = 10_000;
/** Precio mínimo del producto principal que habilita agregar sueltos. */
export const LOOSE_ITEM_ANCHOR_MIN = 40_000;

export const LOOSE_ITEM_MESSAGE = `Agrégalo a tu pedido: los productos de menos de $10.000 se venden junto a un producto desde $40.000.`;

export const isLooseItem = (price: number) => price < LOOSE_ITEM_MAX_PRICE;

/** ¿Hay en el carrito algún producto que habilite los sueltos? */
export const hasAnchorItem = (prices: number[]) => prices.some((price) => price >= LOOSE_ITEM_ANCHOR_MIN);
