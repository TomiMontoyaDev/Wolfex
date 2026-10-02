/**
 * Seed principal (`npx prisma db seed` / `npm run db:seed`): solo importa el catálogo REAL.
 * No crea datos ficticios. Para datos de demostración en desarrollo, usar `npm run db:seed:demo`.
 */
import { prisma } from "./client";
import { syncCatalog } from "./sync-catalog";

syncCatalog()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
