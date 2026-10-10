import { estimateWeightKg } from "@/lib/pricing";

/** Peso de envío de un producto: el registrado en el admin o, si no hay, el estimado por el nombre (1 kg por defecto). */
export function productWeightKg(product: { weightKg?: number | null; name: string; category?: string | null }) {
  return product.weightKg ?? estimateWeightKg(product.name, product.category);
}
