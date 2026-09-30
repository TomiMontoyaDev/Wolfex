import { HomeContent } from "@/components/HomeContent";
import { getFeaturedProducts } from "@/lib/commerce";

export default async function HomePage() {
  // Server-side data boundary: swap the adapter for Shopify later, UI stays the same.
  const products = await getFeaturedProducts();

  return <HomeContent products={products} />;
}
