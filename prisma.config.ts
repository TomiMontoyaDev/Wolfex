import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 no carga archivos .env automáticamente. Next usa .env.local, así que lo cargamos aquí
// para que la CLI (migrate, studio, seed) use la misma configuración que la app.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Las migraciones usan la conexión directa de Neon (sin pooler); la app usa DATABASE_URL (pooled).
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
