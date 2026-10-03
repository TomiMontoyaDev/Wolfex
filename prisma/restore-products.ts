/**
 * Restaura productos desde un respaldo de backup-products.ts.
 *
 *   npm run db:restore-products -- backups/products-AAAA-MM-DD-HHMM.json
 *
 * Deja cada producto del respaldo EXACTAMENTE como estaba (precio, visible, stock, imagen…).
 * Los productos que se hayan borrado después del respaldo se vuelven a crear.
 * No borra productos creados después del respaldo.
 */
import { readFileSync } from "node:fs";
import { prisma } from "./client";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Indica el archivo: npm run db:restore-products -- backups/<archivo>.json");
  const { products } = JSON.parse(readFileSync(file, "utf8")) as { products: Array<Record<string, unknown> & { id: string }> };

  let restored = 0;
  for (let i = 0; i < products.length; i += 10) {
    await Promise.all(
      products.slice(i, i + 10).map(({ id, createdAt, updatedAt, ...data }) => {
        void updatedAt;
        const fields = data as Parameters<typeof prisma.product.create>[0]["data"];
        return prisma.product.upsert({
          where: { id },
          create: { ...fields, id, createdAt: new Date(createdAt as string) },
          update: fields,
        });
      }),
    );
    restored += Math.min(10, products.length - i);
  }
  console.log(`Restaurados ${restored} productos desde ${file}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
