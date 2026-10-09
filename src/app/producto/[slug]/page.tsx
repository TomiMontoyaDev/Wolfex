import type { Metadata } from "next";
import Link from "next/link";
import { ProductDetail } from "@/components/catalog/ProductDetail";
import { ProductCard } from "@/components/sections/FeaturedProducts";
import { SITE } from "@/data/site";
import { findUnavailableProduct, getCatalogProducts } from "@/lib/commerce";
import { db } from "@/server/db";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getCatalogProducts()).find((item) => item.handle === slug);
  if (!product) return { title: "Producto no disponible", robots: { index: false } };
  const description = product.descriptor || `${product.name} de ${product.brand} en WOLFEX. Envío a toda Colombia y entrega HOY en Pereira.`;
  return {
    title: product.name,
    description: description.slice(0, 160),
    alternates: { canonical: `/producto/${slug}` },
    openGraph: { title: `${product.name} | WOLFEX`, description: description.slice(0, 160), images: product.images.primary.ready ? [product.images.primary.src] : undefined },
  };
}

/** Página de producto (tipo tienda): foto, precio, cantidad, agregar al carrito, descripción y relacionados. */
export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const catalog = await getCatalogProducts();
  const product = catalog.find((item) => item.handle === slug);

  if (!product) {
    // Producto desactivado (o enlace viejo): aviso + parecidos activos.
    const inactive = await db.product.findUnique({ where: { slug }, select: { name: true } });
    const unavailable = inactive ? await findUnavailableProduct(inactive.name, catalog) : null;
    return (
      <main className="container-wfx min-h-screen pb-24 pt-[calc(var(--nav-h)+4rem)]">
        <p className="type-label text-arc">Producto no disponible</p>
        <h1 className="mt-3 type-title text-2xl text-bone md:text-3xl">{inactive?.name ?? "No encontramos este producto"}</h1>
        <p className="mt-2 text-sm text-steel">Este producto ya no está disponible en WOLFEX. Te pueden interesar estos:</p>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {(unavailable?.suggestions ?? catalog.filter((item) => item.available).slice(0, 4)).map((item, index) => (
            <ProductCard key={item.id} product={item} index={index} layout="grid" />
          ))}
        </div>
        <Link href="/catalogo" className="mt-10 inline-block type-label text-bone underline-offset-4 hover:text-arc hover:underline">
          Ver todo el catálogo →
        </Link>
      </main>
    );
  }

  // Relacionados: misma categoría, primero los de entrega inmediata.
  const related = catalog
    .filter((item) => item.id !== product.id && item.available && item.category === product.category)
    .sort((a, b) => Number(b.delivery === "STOCK") - Number(a.delivery === "STOCK"))
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    description: product.descriptor || undefined,
    image: product.images.primary.ready ? new URL(product.images.primary.src, SITE.url).href : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "COP",
      availability: product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE.url}/producto/${product.handle}`,
    },
  };

  return (
    <main className="min-h-screen pb-24 pt-[calc(var(--nav-h)+2rem)] md:pt-[calc(var(--nav-h)+3rem)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail product={product} />
      {related.length > 0 && (
        <section className="container-wfx mt-20 md:mt-28" aria-labelledby="related-title">
          <h2 id="related-title" className="type-title text-xl text-bone md:text-2xl">
            También te puede interesar
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} layout="grid" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
