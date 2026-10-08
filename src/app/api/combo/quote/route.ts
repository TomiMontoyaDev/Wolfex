import { NextResponse } from "next/server";
import { z } from "zod";
import { comboSuggestions, computeCombo, publicQuote } from "@/server/combo";

/**
 * Cotización del combo en vivo (carrito, armador y checkout). Solo devuelve el total del descuento,
 * el nivel y sugerencias: nunca costos ni topes por producto. El pedido recalcula todo al crearse.
 */
const quoteSchema = z.object({
  lines: z.array(z.object({ productId: z.string().min(1).max(160), quantity: z.number().int().min(1).max(99) })).max(50),
  suggest: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Cotización inválida." }, { status: 400 });
  try {
    const { lines, suggest } = parsed.data;
    const [result, suggestions] = await Promise.all([computeCombo(lines), suggest ? comboSuggestions(lines.map((line) => line.productId)) : Promise.resolve([])]);
    return NextResponse.json({ ...publicQuote(result), suggestions });
  } catch (error) {
    console.error("[combo] no se pudo cotizar", error instanceof Error ? error.message : error);
    // Sin cotización la tienda sigue funcionando: el pedido igual calcula el descuento al crearse.
    return NextResponse.json({ count: 0, percent: 0, discount: 0, capped: false, next: null, suggestions: [] });
  }
}
