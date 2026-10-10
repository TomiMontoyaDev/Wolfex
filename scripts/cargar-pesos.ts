/**
 * Carga el peso de envío (kg) por producto desde un CSV con columnas `pn` y `weightKg_estimado`.
 *   npx tsx scripts/cargar-pesos.ts <ruta.csv> [--apply]
 * Sin --apply solo muestra lo que haría.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const [file] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
if (!file) throw new Error("Uso: npx tsx scripts/cargar-pesos.ts <ruta.csv> [--apply]");
const apply = process.argv.includes("--apply");

/** CSV simple con comillas dobles. */
function parseCsv(text: string) {
  const rows: string[][] = [];
  for (const line of text.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean)) {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') (cell += '"'), i++;
        else quoted = !quoted;
      } else if (ch === "," && !quoted) cells.push(cell), (cell = "");
      else cell += ch;
    }
    cells.push(cell);
    rows.push(cells);
  }
  return rows;
}

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);

async function main() {
  const [header, ...rows] = parseCsv(readFileSync(file, "utf8"));
  const pnCol = header.indexOf("pn");
  const kgCol = header.indexOf("weightKg_estimado");
  if (pnCol < 0 || kgCol < 0) throw new Error("El CSV debe tener las columnas pn y weightKg_estimado.");
  const weights = new Map(rows.map((row) => [`PN-${row[pnCol].trim().padStart(3, "0")}`, Number(row[kgCol])]));

  const pg = createRequire(process.cwd() + "/")("pg");
  const db = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 20_000 });
  await db.connect();
  const products: Array<{ id: string; sku: string; name: string; weightKg: number | null }> = (
    await db.query(`SELECT id, sku, name, "weightKg" FROM "Product" WHERE active ORDER BY sku`)
  ).rows;
  const missing = products.filter((product) => !(weights.get(product.sku)! > 0));
  const invalid = [...weights].filter(([, kg]) => !(kg > 0 && kg < 50));
  console.log(`CSV: ${weights.size} filas · productos activos: ${products.length} · con peso en el CSV: ${products.length - missing.length}`);
  if (invalid.length) console.log("Pesos inválidos (se ignoran):", invalid);
  if (missing.length) console.log("Sin peso en el CSV (quedan estimados por el nombre):", missing.map((p) => `${p.sku} ${p.name}`));

  if (apply) {
    await db.query("BEGIN");
    let updated = 0;
    for (const product of products) {
      const kg = weights.get(product.sku);
      if (!(kg && kg > 0 && kg < 50)) continue;
      await db.query(`UPDATE "Product" SET "weightKg"=$2, "updatedAt"=now() WHERE id=$1`, [product.id, kg]);
      updated++;
    }
    await db.query("COMMIT");
    console.log(`APLICADO: ${updated} pesos.`);
  }
  await db.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
