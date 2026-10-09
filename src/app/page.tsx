import { HomeContent } from "@/components/HomeContent";
import { COMBO_BUILDER_SLOTS } from "@/config/combos";
import { HERO_SKUS } from "@/config/hero";
import { getCatalogProducts, getFeaturedProducts } from "@/lib/commerce";
import { getBuilderOptions, getRecommendedCombos } from "@/server/combo";
import { getPublishedReviews } from "@/server/reviews";

export default async function HomePage() {
  // Server-side data boundary: swap the adapter for Shopify later, UI stays the same.
  const [products, catalog, reviews, combos, comboOptions] = await Promise.all([
    getFeaturedProducts(),
    getCatalogProducts(),
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

  // Productos del hero (recortes sin fondo), sin importar su posición en el catálogo.
  const heroProducts = catalog.filter((product) => (HERO_SKUS as readonly string[]).includes(product.sku));

  return <HomeContent products={products} heroProducts={heroProducts} reviews={reviews} combos={combos} comboOptions={comboOptions} />;
}
