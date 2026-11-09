/**
 * Lista del proveedor de noviembre 2026: actualiza costo (mayorista), PVP (tachado) y precio de los productos cuyo
 * costo o PVP cambió. El precio sube lo mismo que el costo (más la comisión) para no perder utilidad, queda
 * 2.000 bajo el PVP (o igual al PVP si el costo subió y no alcanza) y nunca por encima.
 * Uso: npx tsx scripts/precios-noviembre-09.mts <plan.json> [--apply]   (plan.json: { changes: [{ id, sku, price, pvp, cost }] })
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const { changes } = JSON.parse(readFileSync(process.argv[2], "utf8")) as { changes: Array<{ id: string; sku: string; price: number; pvp: number; cost: number }> };
const APPLY = process.argv.includes("--apply");
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const pg = createRequire(process.cwd() + "/")("pg");
const db = new pg.Client({ connectionString: env.DATABASE_URL });
await db.connect();
const rows = (await db.query(`SELECT id, sku, name, price, "compareAtPrice", "costPrice" FROM "Product" WHERE id = ANY($1)`, [changes.map((c) => c.id)])).rows;
if (rows.length !== changes.length) throw new Error("Algún producto no existe.");
for (const c of changes) {
  if (c.price % 1000 !== 900 || c.price > c.pvp) throw new Error(`${c.sku}: precio ${c.price} inválido (PVP ${c.pvp}).`);
}
console.log(`${changes.length} productos listos.`);

if (APPLY) {
  const backup = "prisma/backups/precios-antes-2026-11-09.json";
  if (existsSync(backup)) throw new Error(`Ya aplicado (existe ${backup}).`);
  writeFileSync(backup, JSON.stringify(rows, null, 1));
  await db.query("BEGIN");
  for (const c of changes) {
    await db.query(`UPDATE "Product" SET price=$2, "compareAtPrice"=$3, "costPrice"=$4, "updatedAt"=now() WHERE id=$1`, [c.id, c.price, c.pvp, c.cost]);
  }
  await db.query("COMMIT");
  console.log("APLICADO:", changes.length);
}
await db.end();
