/**
 * Sincroniza el catálogo real (src/data/products.ts) con la tabla Product.
 *
 *   npm run db:sync-catalog
 *
 * - Crea los productos nuevos y actualiza nombre, SKU, precio, categoría e imagen de los existentes.
 * - NUNCA toca costPrice ni stock (se gestionan desde /admin/products).
 * - `active`: un producto nuevo hereda `available`; uno existente solo se desactiva si el catálogo
 *   lo marca como no disponible (no se reactiva automáticamente lo que desactivaste en el admin).
 *
 * Ejecutar después de cada cambio de precios en el catálogo, para que el checkout cobre lo que muestra la tienda.
 */
import { CATALOG_SOURCE, PRODUCTS } from "../src/data/products";
import { prisma } from "./client";

export async function syncCatalog() {
  const supplier = await prisma.supplier.upsert({
    where: { slug: "power-nutrition" },
    create: { slug: "power-nutrition", name: "Power Nutrition" },
    update: {},
  });

  let created = 0;
  let updated = 0;
  const existing = new Set((await prisma.product.findMany({ select: { id: true } })).map((product) => product.id));

  // Lotes concurrentes sin transacción envolvente: cada upsert es atómico y el script es idempotente,
  // así que un fallo a mitad se corrige simplemente volviendo a ejecutarlo. (Una transacción de 50
  // upserts supera el timeout de 5 s con la latencia hacia Neon.)
  for (let i = 0; i < PRODUCTS.length; i += 10) {
    const batch = PRODUCTS.slice(i, i + 10);
    await Promise.all(
      batch.map((product) => {
        const data = {
          name: product.name,
          slug: product.handle,
          sku: product.sku,
          brand: product.brand || null,
          description: product.descriptor || null,
          price: product.price,
          image: product.images.primary.ready ? product.images.primary.src : null,
          category: product.category,
          supplierId: supplier.id,
          supplierSku: product.sku,
        };
        if (existing.has(product.id)) updated++;
        else created++;
        return prisma.product.upsert({
          where: { id: product.id },
          create: { id: product.id, ...data, active: product.available },
          update: { ...data, ...(!product.available && { active: false }) },
        });
      }),
    );
  }

  const catalogIds = new Set(PRODUCTS.map((product) => product.id));
  const orphans = [...existing].filter((id) => !catalogIds.has(id) && !id.startsWith("demo-"));
  if (orphans.length) {
    // Productos que salieron del catálogo: se desactivan (no se borran, para conservar el historial).
    await prisma.product.updateMany({ where: { id: { in: orphans } }, data: { active: false } });
  }

  console.log(`Catálogo sincronizado (${CATALOG_SOURCE}): ${created} nuevos, ${updated} actualizados, ${orphans.length} desactivados.`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/sync-catalog.ts")) {
  syncCatalog()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
