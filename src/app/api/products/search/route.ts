import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/commerce";
import { searchProducts } from "@/lib/search";

/** Búsqueda rápida para el buscador del navbar (evita cargar los 681 productos en cada página). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return NextResponse.json({ total: 0, results: [] });
  const { total, results } = searchProducts(await getCatalogProducts(), q, 8);
  return NextResponse.json({ total, results }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
