/**
 * WOLFEX — COMMERCE ADAPTER
 * ─────────────────────────────────────────────────────────────
 * The UI only ever talks to these functions. Products live in Postgres (managed from /admin/products);
 * this module maps them to the storefront `Product` shape so components stay untouched.
 *
 * Cached under the "products" tag: admin changes call updateTag/revalidateTag("products").
 */
import "server-only";
import { unstable_cache } from "next/cache";
import type { Product, ProductCategory } from "@/data/products";
import type { Product as DbProduct } from "@/generated/prisma/client";
import { normalize } from "@/lib/search";
import { db } from "@/server/db";

export const PRODUCTS_TAG = "products";

const PLACEHOLDER_SRC = "/images/products/placeholder.jpg";

/** DB → forma que usan los componentes de la tienda. */
function toStorefront(product: DbProduct): Product {
  // Agotado = sin stock propio o agotado en el proveedor (soldOut): se ve, pero no se puede comprar.
  const available = product.active && !product.soldOut && (product.stock === null || product.stock > 0);
  const slot = (alt: string) => ({
    src: product.image ?? PLACEHOLDER_SRC,
    alt,
    ready: Boolean(product.image),
    art: "cat-performance" as const,
    recommended: "1600x2000 (4:5)",
  });
  return {
    id: product.id,
    sku: product.sku,
    brand: product.brand ?? "",
    handle: product.slug,
    name: product.name,
    descriptor: product.description ?? "",
    category: (product.category ?? "SUPLEMENTOS") as ProductCategory,
    price: product.price,
    available,
    colors: [{ name: "", hex: "#0066FF" }],
    ...(!available && { badge: "AGOTADO" as const }),
    ...(product.compareAtPrice && product.compareAtPrice > product.price && { compareAtPrice: product.compareAtPrice }),
    ...(product.fulfillment && { delivery: product.fulfillment }),
    spec: product.category ?? "",
    images: { primary: slot(`${product.name}, vista principal`), secondary: slot(`${product.name}, detalle`) },
  };
}

const loadCatalogData = unstable_cache(
  async () => {
    // Solo productos visibles y con stock: los agotados (stock 0) se ocultan solos y reaparecen al cargarles stock.
    // stock NULL = inventario no controlado, se muestra siempre.
    const products = await db.product.findMany({
      where: { active: true, OR: [{ stock: null }, { stock: { gt: 0 } }] },
      // Primero los que tienen posición asignada (sortOrder), luego el resto.
      orderBy: [{ sortOrder: { sort: "asc", nulls: "last" } }, { id: "asc" }],
    });
    // lowPriority es una decisión interna: se usa aquí en el servidor y no viaja al navegador.
    // Los agotados en el proveedor van al final: se ven, pero no lideran el catálogo.
    const storefront = products.map(toStorefront).sort((a, b) => Number(!a.available) - Number(!b.available));
    return { products: storefront, lowPriorityIds: products.filter((p) => p.lowPriority).map((p) => p.id) };
  },
  // Subir la versión de la clave invalida la caché al desplegar (útil tras cambios masivos hechos directo en la base).
  ["storefront-catalog", "v10"],
  { tags: [PRODUCTS_TAG], revalidate: 3600 },
);

async function loadCatalog(): Promise<Product[]> {
  return (await loadCatalogData()).products;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  // Destacados del inicio: los 12 primeros según la posición asignada en el admin, sin los de baja prioridad.
  const { products, lowPriorityIds } = await loadCatalogData();
  const lowPriority = new Set(lowPriorityIds);
  return products.filter((product) => product.available && !lowPriority.has(product.id)).slice(0, 12);
}

export async function getCatalogProducts(): Promise<Product[]> {
  return loadCatalog();
}

/**
 * Enlace a un producto desactivado (nombre exacto, SKU o slug en /catalogo?q=…): devuelve su nombre y
 * sugerencias activas de la misma categoría. Solo coincidencia exacta, para no confundir búsquedas normales.
 */
export async function findUnavailableProduct(query: string, catalog: Product[]) {
  const term = query.trim();
  if (term.length < 3) return null;
  const hit = await db.product.findFirst({
    where: {
      active: false,
      OR: [{ sku: { equals: term, mode: "insensitive" } }, { slug: term.toLowerCase() }, { name: { equals: term, mode: "insensitive" } }],
    },
    select: { name: true, category: true },
  });
  // Si hay un producto activo con ese mismo nombre, no hay nada que avisar.
  if (!hit || catalog.some((product) => product.name.toLowerCase() === term.toLowerCase())) return null;
  // Parecidos: misma categoría, primero los que comparten más palabras del nombre (en el orden de la tienda).
  const words = normalize(hit.name).split(/\s+/).filter((word) => word.length > 2 && !/^\d+$/.test(word));
  const shared = (product: Product) => words.filter((word) => normalize(product.name).includes(word)).length;
  const suggestions = catalog
    .filter((product) => product.available && product.category === hit.category)
    .map((product, index) => ({ product, index, score: shared(product) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .map((entry) => entry.product);
  return { name: hit.name, suggestions };
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  return (await loadCatalog()).find((p) => p.handle === handle);
}
