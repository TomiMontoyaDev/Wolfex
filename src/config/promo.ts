/**
 * Campaña "WOLFEX VI · La nueva era" (estética neón/retro de temporada).
 * Usa ofertas REALES de la tienda (niveles de combo y envío gratis): no inventa descuentos.
 * `active: false` apaga la sección del inicio y el pop-up sin tocar código.
 * Ojo: no usar nombres, logos ni tipografías de videojuegos (son marcas registradas).
 */
export const NEON_PROMO = {
  active: true,
  eyebrow: "Temporada neón · edición limitada",
  title: "WOLFEX VI",
  subtitle: "La nueva era",
  /** Página de la promo (a donde apunta el comercial): wolfex.xyz/promo */
  href: "/promo",
  /** Productos que aparecen flotando (PNG sin fondo en /public/images/promo/<sku>.png). */
  skus: ["PN-235", "PN-381", "PN-544", "PN-014"],
  /**
   * Mini promo: productos con más margen y descuento moderado (siguen dejando ≥ 16,5% neto real).
   * Precios aplicados en la base el 2026-10-09; los anteriores están en prisma/backups/promo-wolfex-vi-2026-10-09.json.
   */
  dealSkus: ["PN-632", "PN-147", "PN-512"],
} as const;
