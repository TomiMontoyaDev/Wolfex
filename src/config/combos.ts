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

/**
 * Proteínas grandes (categoría PROTEINAS desde 2 libras, incluye ganadores de masa): cuentan para subir de nivel,
 * pero su descuento tiene este tope aunque el combo esté en −8% o −10%.
 */
export const COMBO_LARGE_PROTEIN = { category: "PROTEINAS", minPounds: 2, maxPercent: 5 } as const;

export interface RecommendedCombo {
  id: string;
  name: string;
  goal: string;
  description: string;
  /** SKUs reales del catálogo (si alguno se agota o desactiva, el combo deja de mostrarse). */
  skus: string[];
}

/**
 * Combos recomendados. Armados alrededor de los productos con margen para el descuento completo
 * (CR7ATINE, RAW, Calcio Citrate) y priorizando el stock en Pereira. Revisado el 2026-10-06 con los costos reales.
 */
export const RECOMMENDED_COMBOS: RecommendedCombo[] = [
  {
    id: "fuerza-recuperacion",
    name: "Combo Fuerza y Recuperación",
    goal: "Fuerza y músculos",
    description: "Creatina para más fuerza y potencia, magnesio para la función muscular y el descanso, y calcio para tus huesos.",
    skus: ["PN-681", "PN-203", "PN-147"],
  },
  {
    id: "energia",
    name: "Combo Energía",
    goal: "Fuerza y energía",
    description: "Creatina para rendir más, pre-entreno para cada sesión y un pack de sticks para probar sabores nuevos.",
    skus: ["PN-681", "PN-166", "PN-613"],
  },
  {
    id: "rendimiento",
    name: "Combo Rendimiento Total",
    goal: "Todo en uno",
    description: "Proteína, creatina, pre-entreno y omega 3: el stack completo para entrenar y cuidar tu salud.",
    skus: ["PN-014", "PN-681", "PN-166", "PN-640"],
  },
  {
    id: "inicio",
    name: "Combo Inicio",
    goal: "Masa muscular",
    description: "Lo básico para arrancar: proteína para recuperar, creatina para fuerza y omega 3 para tu salud.",
    skus: ["PN-014", "PN-632", "PN-640"],
  },
  {
    id: "huesos-descanso",
    name: "Combo Huesos y Descanso",
    goal: "Salud y descanso",
    description: "Calcio para tus huesos, magnesio para el descanso y los músculos, y omega 3 para el corazón.",
    skus: ["PN-147", "PN-203", "PN-640"],
  },
  {
    id: "prueba-sticks",
    name: "Combo Prueba Sticks",
    goal: "Prueba antes de elegir",
    description: "Dos packs de pre-entreno y uno de quemador en sobres individuales: prueba varios antes de comprar un tarro completo.",
    skus: ["PN-613", "PN-617", "PN-611"],
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
