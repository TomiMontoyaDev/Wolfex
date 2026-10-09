import { HomeContent } from "@/components/HomeContent";
import { COMBO_BUILDER_SLOTS } from "@/config/combos";
import { getFeaturedProducts } from "@/lib/commerce";
import { getBuilderOptions, getRecommendedCombos } from "@/server/combo";
import { getPublishedReviews } from "@/server/reviews";

export default async function HomePage() {
  // Server-side data boundary: swap the adapter for Shopify later, UI stays the same.
  const [products, reviews, combos, comboOptions] = await Promise.all([
    getFeaturedProducts(),
    // Las reseñas no deben tumbar el inicio: si fallan, la sección simplemente no aparece.
    getPublishedReviews().catch((error) => {
      console.error("[home] no se pudieron cargar las reseñas", error);
      return [];
    }),
    getRecommendedCombos().catch((error) => {
      console.error("[home] no se pudieron cargar los combos", error);
      return [];
    }),
    getBuilderOptions(COMBO_BUILDER_SLOTS),
  ]);

  return <HomeContent products={products} reviews={reviews} combos={combos} comboOptions={comboOptions} />;
}
