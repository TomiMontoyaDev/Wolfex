"use client";

import { ComboBuilderSection, RecommendedCombos } from "@/components/combo/ComboSection";
import { NeonPromo } from "@/components/promo/NeonPromo";
import { BrandStatement } from "@/components/sections/BrandStatement";
import { CampaignSection } from "@/components/sections/CampaignSection";
import { Categories } from "@/components/sections/Categories";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { Hero } from "@/components/sections/Hero";
import { Newsletter } from "@/components/sections/Newsletter";
import { PerformanceSection } from "@/components/sections/PerformanceSection";
import { Reviews } from "@/components/sections/Reviews";
import { Marquee } from "@/components/ui/Marquee";
import type { Product } from "@/data/products";
import type { RecommendedComboView } from "@/server/combo";
import type { PublicReview } from "@/server/reviews";

const MANTRAS = ["NACIDOS PARA CAZAR.", "SIN EXCUSAS.", "MÁS ALLÁ DE TUS LÍMITES.", "ENCUENTRA TU LOBO.", "ALCANZA TU CIMA."];

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
  return (
    <main>
      {/* Orden para vender en celular: oferta → más vendidos → combos → confianza → armador → marca. */}
      <Hero />
      <FeaturedProducts products={products} />
      <RecommendedCombos combos={combos} />
      <Reviews reviews={reviews} />
      <ComboBuilderSection options={comboOptions} />
      <BrandStatement />
      <CampaignSection />
      <NeonPromo />
      <Marquee items={MANTRAS} className="bg-void type-headline text-[clamp(1.1rem,2.2vw,1.75rem)] text-bone/90" />
      <Categories />
      <PerformanceSection />
      <Newsletter />
    </main>
  );
}
