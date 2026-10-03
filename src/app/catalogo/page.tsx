import { CatalogContent } from "@/components/catalog/CatalogContent";
import { CATEGORY_SLUGS, type CategorySlug } from "@/data/site";
import { getCatalogProducts } from "@/lib/commerce";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [products, params] = await Promise.all([getCatalogProducts(), searchParams]);
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const slug = typeof params.categoria === "string" ? params.categoria.toLowerCase() : "";
  const category = slug in CATEGORY_SLUGS ? CATEGORY_SLUGS[slug as CategorySlug] : undefined;

  // key: entrar desde el menú (otra categoría o búsqueda) reinicia los filtros del catálogo.
  return <CatalogContent key={`${q}|${category ?? ""}`} products={products} initialQuery={q} initialCategory={category} />;
}
