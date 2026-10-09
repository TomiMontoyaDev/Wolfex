import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";
import { getCatalogProducts } from "@/lib/commerce";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["/catalogo", "/envios", "/devoluciones", "/preguntas-frecuentes", "/contacto", "/privacidad"];
  // Cada producto activo tiene su página: Google puede mostrarlos uno a uno.
  const products = await getCatalogProducts().catch(() => []);
  return [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    ...pages.map((path) => ({ url: `${SITE.url}${path}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: path === "/catalogo" ? 0.9 : 0.4 })),
    ...products.map((product) => ({ url: `${SITE.url}/producto/${product.handle}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
