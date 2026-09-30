import { BrandStatement } from "@/components/sections/BrandStatement";
import { CampaignSection } from "@/components/sections/CampaignSection";
import { Categories } from "@/components/sections/Categories";
import { Community } from "@/components/sections/Community";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { Hero } from "@/components/sections/Hero";
import { MotorSection } from "@/components/sections/MotorSection";
import { Newsletter } from "@/components/sections/Newsletter";
import { PerformanceSection } from "@/components/sections/PerformanceSection";
import { Marquee } from "@/components/ui/Marquee";
import { SITE } from "@/data/site";
import { getFeaturedProducts } from "@/lib/commerce";

export default async function HomePage() {
  // Server-side data boundary: swap the adapter for Shopify later, UI stays the same.
  const products = await getFeaturedProducts();

  return (
    <main>
      <Hero />
      <Marquee items={SITE.mantras} className="bg-void type-headline text-[clamp(1.1rem,2.2vw,1.75rem)] text-bone/90" />
      <BrandStatement />
      <FeaturedProducts products={products} />
      <CampaignSection />
      <Categories />
      <Marquee items={["Train", "Move", "Build", "Repeat"]} reverse className="bg-ink type-display text-[clamp(1.5rem,3vw,2.5rem)] text-outline-volt" />
      <PerformanceSection />
      <MotorSection />
      <Community />
      <Newsletter />
    </main>
  );
}
