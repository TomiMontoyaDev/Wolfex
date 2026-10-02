import { CatalogContent } from "@/components/catalog/CatalogContent";
import { getCatalogProducts } from "@/lib/commerce";

export default async function CatalogPage() {
  const products = await getCatalogProducts();

  return <CatalogContent products={products} />;
}
