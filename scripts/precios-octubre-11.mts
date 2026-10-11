/**
 * Actualización del 11-oct-2026 (lista Power Nutrition octubre 2026):
 * precios nuevos, precio tachado = PVP en todos, agotados del proveedor, productos pesados y nombres corregidos.
 * Uso: npx tsx scripts/precios-octubre-11.ts <precios.txt> <match.json> [--apply]
 *   precios.txt: "ID PRECIO_ANTERIOR PRECIO_NUEVO" por línea (ID = número del SKU PN-xxx).
 *   match.json: cruce catálogo ↔ lista del proveedor (entry.publicPrice = PVP).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const [listPath, matchPath] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

const SOLD_OUT = ["099", "103", "307", "332", "465", "469", "476", "508", "564", "567"].map((id) => `PN-${id}`);
const TYPOS: Array<[RegExp, string]> = [
  [/\bSERVICOS\b/g, "SERVICIOS"],
  [/RASPERRY/g, "RASPBERRY"],
  [/PENAUT/g, "PEANUT"],
  [/SUGGAR/g, "SUGAR"],
  [/WATERMELOM/g, "WATERMELON"],
  [/MARSMALLOW/g, "MARSHMALLOW"],
  [/SOFGELS/g, "SOFTGELS"],
];
const fixTypos = (text: string) => TYPOS.reduce((value, [pattern, fix]) => value.replace(pattern, fix), text);

/** 5 lb o más, creatinas de 1 kg o de 200+ servicios. */
function isHeavy(name: string) {
  const n = name.toUpperCase().replace(",", ".");
  const pounds = Number(n.match(/(\d+(?:\.\d+)?)\s*LIBRAS?/)?.[1] ?? 0);
  if (pounds >= 5) return true;
  if (/\b1\s*KILO/.test(n)) return true;
  const servings = Number(n.match(/(\d+)\s*SERVIC/)?.[1] ?? 0);
  return /CREA|CREATIN/.test(n) && servings >= 200;
}

const list = readFileSync(listPath, "utf8").trim().split(/\r?\n/).map((line) => {
  const [id, before, after] = line.trim().split(/\s+/);
  return { sku: `PN-${id}`, before: Number(before), after: Number(after) };
});
const pvpById = new Map<string, number>(
  JSON.parse(readFileSync(matchPath, "utf8"))
    .filter((m: { entry?: { status?: string; publicPrice?: number } }) => m.entry?.status === "OK" && m.entry.publicPrice)
    .map((m: { id: string; entry: { publicPrice: number } }) => [m.id, m.entry.publicPrice]),
);

const pg = createRequire(process.cwd() + "/")("pg");
const db = new pg.Client({ connectionString: env.DATABASE_URL });
await db.connect();
type Row = { id: string; sku: string; name: string; price: number; compareAtPrice: number | null; active: boolean; soldOut: boolean; heavy: boolean; flavors: string[] };
const rows: Row[] = (await db.query(`SELECT id, sku, name, price, "compareAtPrice", active, "soldOut", heavy, flavors FROM "Product"`)).rows;
const bySku = new Map(rows.map((row) => [row.sku, row]));

const problems: string[] = [];
const newPrice = new Map<string, number>();
for (const item of list) {
  const row = bySku.get(item.sku);
  if (!row) { problems.push(`${item.sku}: no existe`); continue; }
  if (!row.active) problems.push(`${item.sku}: está inactivo (se actualiza igual)`);
  if (row.price !== item.before) problems.push(`${item.sku}: precio actual ${row.price}, la lista dice ${item.before}`);
  newPrice.set(row.id, item.after);
}

const updates = rows.map((row) => {
  const price = newPrice.get(row.id) ?? row.price;
  const pvp = pvpById.get(row.id) ?? null;
  return {
    row,
    price,
    // PVP de la lista como precio de comparación (la tienda lo tacha solo si es mayor que el precio).
    compareAtPrice: pvp ?? row.compareAtPrice,
    soldOut: row.soldOut || SOLD_OUT.includes(row.sku),
    heavy: isHeavy(row.name),
    name: fixTypos(row.name),
    flavors: row.flavors.map(fixTypos),
    pvp,
  };
});

const overPvp = updates.filter((u) => u.row.active && !u.soldOut && u.pvp && u.price > u.pvp);
const changed = updates.filter(
  (u) => u.price !== u.row.price || u.compareAtPrice !== u.row.compareAtPrice || u.soldOut !== u.row.soldOut || u.heavy !== u.row.heavy || u.name !== u.row.name || u.flavors.join() !== u.row.flavors.join(),
);
console.log(`Lista: ${list.length} · precios que cambian: ${updates.filter((u) => u.price !== u.row.price).length}`);
console.log(`Agotados nuevos: ${updates.filter((u) => u.soldOut && !u.row.soldOut).map((u) => u.row.sku).join(", ")}`);
console.log(`Pesados: ${updates.filter((u) => u.heavy && u.row.active).length} activos → ${updates.filter((u) => u.heavy && u.row.active).map((u) => u.row.sku).join(" ")}`);
console.log(`Nombres corregidos: ${updates.filter((u) => u.name !== u.row.name).map((u) => `${u.row.sku} ${u.name}`).join(" | ")}`);
console.log(`Sin PVP en la lista: ${updates.filter((u) => u.row.active && !u.pvp).map((u) => u.row.sku).join(" ")}`);
console.log(`Disponibles con precio > PVP: ${overPvp.length}`, overPvp.map((u) => `${u.row.sku} ${u.price} > ${u.pvp}`));
console.log("Avisos:", problems.length ? problems : "ninguno");

if (APPLY) {
  const backup = "prisma/backups/precios-antes-2026-10-11.json";
  if (existsSync(backup)) throw new Error(`Ya aplicado (existe ${backup}).`);
  writeFileSync(backup, JSON.stringify(changed.map((u) => ({ id: u.row.id, sku: u.row.sku, name: u.row.name, price: u.row.price, compareAtPrice: u.row.compareAtPrice, soldOut: u.row.soldOut, flavors: u.row.flavors })), null, 1));
  await db.query("BEGIN");
  for (const u of changed) {
    await db.query(`UPDATE "Product" SET price=$2, "compareAtPrice"=$3, "soldOut"=$4, heavy=$5, name=$6, flavors=$7, "updatedAt"=now() WHERE id=$1`, [
      u.row.id, u.price, u.compareAtPrice, u.soldOut, u.heavy, u.name, u.flavors,
    ]);
  }
  await db.query("COMMIT");
  console.log("APLICADO:", changed.length, "productos");
}
await db.end();
