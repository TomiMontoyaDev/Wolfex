"use client";

import { BrandStatement } from "@/components/sections/BrandStatement";
import { CampaignSection } from "@/components/sections/CampaignSection";
import { Categories } from "@/components/sections/Categories";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { Hero } from "@/components/sections/Hero";
import { Newsletter } from "@/components/sections/Newsletter";
import { PerformanceSection } from "@/components/sections/PerformanceSection";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Marquee } from "@/components/ui/Marquee";
import type { Product } from "@/data/products";

export function HomeContent({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const mantras = ["BUILT TO HUNT.", "NO COMFORT.", "BEYOND YOUR LIMITS.", "FIND YOUR WOLF.", "HUNT YOUR APEX."];

  return (
    <main>
      <Hero />
      <Marquee items={mantras.map(t)} className="bg-void type-headline text-[clamp(1.1rem,2.2vw,1.75rem)] text-bone/90" />
      <BrandStatement />
      <FeaturedProducts products={products} />
      <CampaignSection />
      <Categories />
      <Marquee items={["Fuel", "Build", "Recover", "Repeat"].map(t)} reverse className="bg-ink type-display text-[clamp(1.5rem,3vw,2.5rem)] text-outline-volt" />
      <PerformanceSection />
      <Newsletter />
    </main>
  );
}
