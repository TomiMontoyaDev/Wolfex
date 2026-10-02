// Cliente de Prisma para scripts de línea de comandos (seed, sync). La app usa src/server/db.ts.
import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Falta DATABASE_URL (en .env.local o en el entorno).");
  process.exit(1);
}

export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
