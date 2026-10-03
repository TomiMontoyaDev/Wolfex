/**
 * Respaldo completo de la tabla Product en un archivo JSON.
 *
 *   npm run db:backup-products            → backups/products-AAAA-MM-DD-HHMM.json
 *
 * Para restaurar: npm run db:restore-products -- backups/<archivo>.json
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { prisma } from "./client";

async function main() {
  const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
  mkdirSync("backups", { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
  const file = `backups/products-${stamp}.json`;
  writeFileSync(file, JSON.stringify({ createdAt: new Date().toISOString(), count: products.length, products }, null, 2));
  console.log(`Respaldo creado: ${file} (${products.length} productos)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
