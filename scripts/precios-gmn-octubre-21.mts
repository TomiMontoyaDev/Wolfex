/**
 * Lista nueva de GMN (21-oct-2026): precio web, PVP (tachado) y costo mayorista de los productos GMN ya publicados.
 * No crea productos. Uso: npx tsx scripts/precios-gmn-octubre-21.mts [--apply]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const PRICES: Record<string, { price: number; pvp: number; cost: number }> = {
  "PN-124": { price: 85_900, pvp: 89_200, cost: 66_900 }, // MEGA GAINER 2 LIBRAS
  "PN-125": { price: 192_900, pvp: 196_300, cost: 147_225 }, // MEGA GAINER 5 LIBRAS
  "PN-128": { price: 73_900, pvp: 77_700, cost: 58_275 }, // SUPER MEGA GAINER 2 LIBRAS
  "PN-129": { price: 167_900, pvp: 171_100, cost: 128_000 }, // SUPER MEGA GAINER 5 LIBRAS
  "PN-131": { price: 126_900, pvp: 130_600, cost: 97_950 }, // NITRO MASS 2 LIBRAS
};
const APPLY = process.argv.includes("--apply");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const pg = createRequire(process.cwd() + "/")("pg");
const db = new pg.Client({ connectionString: env.DATABASE_URL });
await db.connect();
const rows = (await db.query(`SELECT id, sku, name, brand, price, "compareAtPrice", "costPrice", active FROM "Product" WHERE sku = ANY($1)`, [Object.keys(PRICES)])).rows;
for (const row of rows) {
  if (row.brand !== "GMN" || !row.active) throw new Error(`${row.sku} no es un GMN publicado.`);
  const next = PRICES[row.sku];
  console.log(`${row.sku} ${row.name}: ${row.price} → ${next.price} · PVP ${row.compareAtPrice} → ${next.pvp} · costo ${row.costPrice} → ${next.cost}`);
}
if (rows.length !== Object.keys(PRICES).length) throw new Error("Falta algún producto.");

if (APPLY) {
  const backup = "prisma/backups/precios-gmn-antes-2026-10-21.json";
  if (existsSync(backup)) throw new Error(`Ya aplicado (existe ${backup}).`);
  writeFileSync(backup, JSON.stringify(rows, null, 1));
  await db.query("BEGIN");
  for (const row of rows) {
    const next = PRICES[row.sku];
    await db.query(`UPDATE "Product" SET price=$2, "compareAtPrice"=$3, "costPrice"=$4, "updatedAt"=now() WHERE id=$1`, [row.id, next.price, next.pvp, next.cost]);
  }
  await db.query("COMMIT");
  console.log("APLICADO:", rows.length);
}
await db.end();
