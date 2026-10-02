import { CatalogContent } from "@/components/catalog/CatalogContent";
import { getCatalogProducts } from "@/lib/commerce";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [products, params] = await Promise.all([getCatalogProducts(), searchParams]);
  const q = typeof params.q === "string" ? params.q.slice(0, 80) : "";

  // key: una búsqueda nueva desde el navbar reinicia los filtros del catálogo.
  return <CatalogContent key={q} products={products} initialQuery={q} />;
}
