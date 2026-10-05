import { HomeContent } from "@/components/HomeContent";
import { getFeaturedProducts } from "@/lib/commerce";
import { getPublishedReviews } from "@/server/reviews";

export default async function HomePage() {
  // Server-side data boundary: swap the adapter for Shopify later, UI stays the same.
  const [products, reviews] = await Promise.all([
    getFeaturedProducts(),
    // Las reseñas no deben tumbar el inicio: si fallan, la sección simplemente no aparece.
    getPublishedReviews().catch((error) => {
      console.error("[home] no se pudieron cargar las reseñas", error);
      return [];
    }),
  ]);

  return <HomeContent products={products} reviews={reviews} />;
}
