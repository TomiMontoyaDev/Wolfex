import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NeonPromo } from "@/components/promo/NeonPromo";
import { PromoCatalog } from "@/components/promo/PromoCatalog";
import { NEON_PROMO } from "@/config/promo";
import { getCatalogProducts } from "@/lib/commerce";
import { MAX_COMBO_PERCENT } from "@/lib/combo";
import { visibleDiscount } from "@/lib/pricing";
import { getRecommendedCombos } from "@/server/combo";

export const metadata: Metadata = {
  title: "Promo WOLFEX VI · La nueva era",
  description: `Todas las ofertas de WOLFEX en un solo lugar: productos en promo, descuentos por combo hasta −${MAX_COMBO_PERCENT}% y envío gratis a toda Colombia.`,
  alternates: { canonical: "/promo" },
  openGraph: { title: "WOLFEX VI · La nueva era", description: `Ofertas, combos hasta −${MAX_COMBO_PERCENT}% y envío gratis. Suplementos originales con entrega HOY en Pereira.` },
};

/** Descuento mínimo frente al PVP para entrar en "Todos los descuentos" de la promo. */
const PROMO_MIN_DISCOUNT = 5;

/** Página de la campaña (destino del comercial): todas las ofertas vigentes de la tienda. */
export default async function PromoPage() {
  if (!NEON_PROMO.active) notFound();
  const [catalog, combos] = await Promise.all([getCatalogProducts(), getRecommendedCombos().catch(() => [])]);
  const available = catalog.filter((product) => product.available);
  const dealSkus = NEON_PROMO.dealSkus as readonly string[];
  const deals = available.filter((product) => dealSkus.includes(product.sku));
  // Los que están al menos 5% bajo el precio público (PVP), de mayor a menor descuento.
  const discounted = available
    .filter((product) => !dealSkus.includes(product.sku) && (visibleDiscount(product.price, product.compareAtPrice) ?? 0) >= PROMO_MIN_DISCOUNT)
    .sort((a, b) => (visibleDiscount(b.price, b.compareAtPrice) ?? 0) - (visibleDiscount(a.price, a.compareAtPrice) ?? 0));

  return (
    <main className="bg-[#0b0016]">
      <NeonPromo variant="page" />
      <PromoCatalog deals={deals} discounted={discounted} combos={combos} />
    </main>
  );
}
