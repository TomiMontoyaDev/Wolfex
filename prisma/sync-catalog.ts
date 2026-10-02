/**
 * Importación inicial del catálogo (src/data/products.ts) a la tabla Product.
 *
 *   npm run db:sync-catalog              → solo si la tabla está vacía (no-op en cada deploy)
 *   npm run db:sync-catalog -- --missing → agrega los productos del archivo que no existan en la base
 *
 * Desde que los productos se gestionan en /admin/products, la BASE DE DATOS es la fuente de verdad:
 * este script NUNCA modifica productos existentes (precio, imagen, nombre, stock…), así que no pisa
 * lo que edites en el admin. Ojo con --missing: vuelve a crear productos que hayas borrado.
 *
 * Los productos marcados como no disponibles en el archivo se importan visibles pero agotados (stock 0).
 */
import { CATALOG_SOURCE, PRODUCTS } from "../src/data/products";
import { prisma } from "./client";

export async function syncCatalog({ missing = false } = {}) {
  const count = await prisma.product.count({ where: { id: { not: { startsWith: "demo-" } } } });
  if (count > 0 && !missing) {
    console.log(`La tabla Product ya tiene ${count} productos: no se importa nada (usa --missing para agregar faltantes).`);
    return;
  }

  const supplier = await prisma.supplier.upsert({
    where: { slug: "power-nutrition" },
    create: { slug: "power-nutrition", name: "Power Nutrition" },
    update: {},
  });
  const existing = new Set((await prisma.product.findMany({ select: { id: true } })).map((product) => product.id));
  const toCreate = PRODUCTS.filter((product) => !existing.has(product.id));

  const result = await prisma.product.createMany({
    skipDuplicates: true,
    data: toCreate.map((product) => ({
      id: product.id,
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
      active: true,
      // No disponible en el catálogo original → visible como AGOTADO hasta que cargues stock.
      stock: product.available ? null : 0,
    })),
  });

  console.log(`Catálogo (${CATALOG_SOURCE}): ${result.count} productos importados.`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/sync-catalog.ts")) {
  syncCatalog({ missing: process.argv.includes("--missing") })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
