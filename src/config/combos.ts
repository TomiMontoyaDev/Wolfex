/**
 * Combos: descuento por llevar varios productos distintos. Editable aquí.
 * El descuento real de cada producto tiene un tope automático para no bajar del margen neto mínimo
 * (ver src/server/combo.ts): por eso en la tienda se anuncia "hasta X%".
 */

/** Niveles por cantidad de productos DISTINTOS que cuentan para el combo. */
export const COMBO_TIERS = [
  { minItems: 2, percent: 5 },
  { minItems: 3, percent: 8 },
  { minItems: 4, percent: 10 },
] as const;

/**
 * Margen neto mínimo que debe dejar cada producto con el descuento de combo (después de la comisión de pasarela).
 * 0.15 = la regla general de la tienda. Súbelo (p. ej. 0.18) para ganar más por combo a cambio de descuentos menores.
 */
export const COMBO_MIN_NET_MARGIN = 0.15;

/** Solo cuentan (y se descuentan) productos desde este precio: evita armar combos con sobres sueltos. */
export const COMBO_MIN_ITEM_PRICE = 40_000;

export interface RecommendedCombo {
  id: string;
  name: string;
  goal: string;
  description: string;
  /** SKUs reales del catálogo (si alguno se agota o desactiva, el combo deja de mostrarse). */
  skus: string[];
}

/** Combos recomendados: armados con productos en stock en Pereira y con margen para el descuento. */
export const RECOMMENDED_COMBOS: RecommendedCombo[] = [
  {
    id: "inicio",
    name: "Combo Inicio",
    goal: "Masa muscular",
    description: "Lo básico para arrancar: proteína para recuperar, creatina para fuerza y omega 3 para tu salud.",
    skus: ["PN-014", "PN-632", "PN-640"],
  },
  {
    id: "fuerza",
    name: "Combo Fuerza",
    goal: "Fuerza y energía",
    description: "Creatina para más fuerza y potencia, más un pre-entreno para llegar con energía a cada sesión.",
    skus: ["PN-681", "PN-166"],
  },
  {
    id: "rendimiento",
    name: "Combo Rendimiento Total",
    goal: "Todo en uno",
    description: "Proteína, creatina, pre-entreno y omega 3: el stack completo para entrenar y recuperarte mejor.",
    skus: ["PN-381", "PN-014", "PN-166", "PN-640"],
  },
  {
    id: "definicion",
    name: "Combo Definición",
    goal: "Quemar grasa",
    description: "L-carnitina, quemador termogénico y CLA para acompañar tu etapa de definición con dieta y ejercicio.",
    skus: ["PN-393", "PN-268", "PN-386"],
  },
  {
    id: "bienestar",
    name: "Combo Bienestar",
    goal: "Salud y descanso",
    description: "Magnesio para el descanso y los músculos, omega 3 para el corazón y zinc para tus defensas.",
    skus: ["PN-203", "PN-640", "PN-646"],
  },
];

/** Pasos del armador de combos: una categoría por paso (todos opcionales). */
export const COMBO_BUILDER_SLOTS = [
  { id: "proteina", label: "Proteína", hint: "Recuperación y masa muscular", categories: ["PROTEINAS"] },
  { id: "creatina", label: "Creatina", hint: "Fuerza y potencia", categories: ["CREATINAS"] },
  { id: "pre", label: "Pre-entreno", hint: "Energía y bombeo", categories: ["PRE-ENTRENO"] },
  { id: "bienestar", label: "Vitaminas y bienestar", hint: "Salud, descanso y defensas", categories: ["VITAMINAS Y BIENESTAR"] },
  { id: "extra", label: "Extra", hint: "Quemadores y aminoácidos", categories: ["SUPLEMENTOS", "AMINOACIDOS"] },
] as const;
