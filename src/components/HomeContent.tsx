"use client";

import { ComboSection } from "@/components/combo/ComboSection";
import { BrandStatement } from "@/components/sections/BrandStatement";
import { CampaignSection } from "@/components/sections/CampaignSection";
import { Categories } from "@/components/sections/Categories";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { Hero } from "@/components/sections/Hero";
import { Newsletter } from "@/components/sections/Newsletter";
import { PerformanceSection } from "@/components/sections/PerformanceSection";
import { Reviews } from "@/components/sections/Reviews";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Marquee } from "@/components/ui/Marquee";
import type { Product } from "@/data/products";
import type { RecommendedComboView } from "@/server/combo";
import type { PublicReview } from "@/server/reviews";

export function HomeContent({
  products,
  reviews,
  combos,
  comboOptions,
}: {
  products: Product[];
  reviews: PublicReview[];
  combos: RecommendedComboView[];
  comboOptions: Record<string, Product[]>;
}) {
  const { t } = useLanguage();
  const mantras = ["BUILT TO HUNT.", "NO COMFORT.", "BEYOND YOUR LIMITS.", "FIND YOUR WOLF.", "HUNT YOUR APEX."];

  return (
    <main>
      <Hero products={products} />
      {/* Orden pensado para vender: el catálogo apenas termina el hero, luego combos, la marca y las reseñas. */}
      <FeaturedProducts products={products} />
      <ComboSection combos={combos} options={comboOptions} />
      <BrandStatement />
      <Reviews reviews={reviews} />
      <Marquee items={mantras.map(t)} className="bg-void type-headline text-[clamp(1.1rem,2.2vw,1.75rem)] text-bone/90" />
      <CampaignSection />
      <Categories />
      <Marquee items={["Fuel", "Build", "Recover", "Repeat"].map(t)} reverse className="bg-ink type-display text-[clamp(1.5rem,3vw,2.5rem)] text-outline-volt" />
      <PerformanceSection />
      <Newsletter />
    </main>
  );
}
