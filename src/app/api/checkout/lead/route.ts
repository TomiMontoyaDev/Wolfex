import { NextResponse } from "next/server";
import { leadSchema, saveLead } from "@/server/leads";

/** Guarda lo que el cliente va escribiendo en el checkout (antes de pagar) como posible cliente del panel. */
export async function POST(request: Request) {
  // Solo la propia tienda.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });

  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ skipped: true }, { status: 202 });
  try {
    await saveLead(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Captura de datos, no checkout: si falla, la compra sigue igual.
    console.error("[lead] no se pudo guardar", error instanceof Error ? error.message : error);
    return NextResponse.json({ skipped: true }, { status: 202 });
  }
}
