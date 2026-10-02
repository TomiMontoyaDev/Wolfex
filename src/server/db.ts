import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Reutiliza una sola instancia en desarrollo para que el hot reload no abra conexiones nuevas.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta DATABASE_URL en el servidor.");
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  else globalForPrisma.prisma ??= client;
  return client;
}

/**
 * Cliente perezoso: se conecta en la primera consulta, no al importar el módulo.
 * Así una página que importa `db` no se cae entera si falta DATABASE_URL; falla solo la consulta.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
