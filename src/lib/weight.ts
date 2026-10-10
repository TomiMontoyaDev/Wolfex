import { estimateWeightKg } from "@/lib/pricing";

/** Servicios por envase leídos del nombre ("100 SERVICIOS", "15 PORCIONES"); null si no lo dice. */
export function servingsFromName(name: string): number | null {
  const match = name.toUpperCase().match(/(\d+)\s*(?:SERVICIOS|SERVICOS|PORCIONES)\b/);
  const servings = match ? Number(match[1]) : null;
  return servings && servings > 1 ? servings : null;
}

/** Peso de envío de un producto: el registrado en el admin o, si no hay, el estimado por el nombre (1 kg por defecto). */
export function productWeightKg(product: { weightKg?: number | null; name: string; category?: string | null }) {
  return product.weightKg ?? estimateWeightKg(product.name, product.category);
}
