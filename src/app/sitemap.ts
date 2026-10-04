import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/catalogo", "/envios", "/devoluciones", "/preguntas-frecuentes", "/contacto", "/privacidad"];
  return [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    ...pages.map((path) => ({ url: `${SITE.url}${path}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: path === "/catalogo" ? 0.9 : 0.4 })),
  ];
}
