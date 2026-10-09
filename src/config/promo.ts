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
  /** Productos que aparecen flotando (PNG sin fondo en /public/images/promo/<sku>.png). */
  skus: ["PN-235", "PN-381", "PN-544", "PN-014"],
} as const;
