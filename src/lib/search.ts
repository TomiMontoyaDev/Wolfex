import type { Product } from "@/data/products";

/** Minúsculas y sin tildes: "Proteína" y "proteina" coinciden. */
export function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function tokens(query: string) {
  return normalize(query).split(/\s+/).filter(Boolean);
}

/** Puntaje de coincidencia; 0 = no coincide. Todas las palabras deben aparecer en nombre, marca, categoría o SKU. */
export function scoreProduct(product: Product, query: string) {
  const words = tokens(query);
  if (!words.length) return 1;
  const name = normalize(product.name);
  const haystack = `${name} ${normalize(product.brand)} ${normalize(product.category)} ${normalize(product.sku)}`;
  if (!words.every((word) => haystack.includes(word))) return 0;

  let score = 1;
  const full = words.join(" ");
  if (name.startsWith(full)) score += 6;
  else if (name.includes(full)) score += 3;
  score += words.filter((word) => name.includes(word)).length;
  if (product.available) score += 2;
  return score;
}

export function searchProducts(products: Product[], query: string, limit?: number) {
  const ranked = products
    .map((product) => ({ product, score: scoreProduct(product, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
  return {
    total: ranked.length,
    results: (limit ? ranked.slice(0, limit) : ranked).map((entry) => entry.product),
  };
}
