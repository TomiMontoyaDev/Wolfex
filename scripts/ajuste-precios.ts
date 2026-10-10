/**
 * Ajuste de precios con la política real de envío (escenario D del reporte de márgenes):
 *  - pedido < $150.000: el cliente paga $14.900 de envío y tú cubres la diferencia si el envío real cuesta más;
 *  - pedido ≥ $150.000: envío gratis (lo asumes tú).
 * Comisión Mercado Pago = precio × 3,29% × (1 + IVA 19%) + $800. Envío real = $11.100 por kg iniciado (mín. 1 kg).
 * SOLO SUBE precios que dejan menos del margen objetivo; nunca baja (con envío gratis el margen se iría).
 * No toca: promos activas, productos con entrega HOY en Pereira (STOCK) ni agotados.
 *   npx tsx scripts/ajuste-precios.ts [--apply]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { NEON_PROMO } from "../src/config/promo";
import { FREE_SHIPPING_NATIONAL_MIN, SHIPPING_RATE_NATIONAL } from "../src/config/shipping";

const P = { pct: 0.0329, iva: 0.19, fixed: 800, perKg: 11_100, target: 0.15 };
const apply = process.argv.includes("--apply");
const roundUp900 = (value: number) => Math.ceil((value - 900) / 1000) * 1000 + 900;

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);

/** Margen neto con la política real (producto comprado solo). */
export function marginD(price: number, cost: number, weightKg: number, national: boolean) {
  const commission = price * P.pct * (1 + P.iva) + P.fixed;
  const realShipping = national ? Math.max(1, Math.ceil(weightKg - 1e-9)) * P.perKg : 0;
  const shippingCost = !national ? 0 : price >= FREE_SHIPPING_NATIONAL_MIN ? realShipping : Math.max(0, realShipping - SHIPPING_RATE_NATIONAL);
  return (price - cost - commission - shippingCost) / price;
}

async function main() {
  const pg = createRequire(process.cwd() + "/")("pg");
  const db = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 20_000 });
  await db.connect();
  const products: Array<{ id: string; sku: string; name: string; price: number; compareAtPrice: number | null; costPrice: number | null; fulfillment: string | null; weightKg: number | null; soldOut: boolean }> = (
    await db.query(`SELECT id, sku, name, price, "compareAtPrice", "costPrice", fulfillment, "weightKg", "soldOut" FROM "Product" WHERE active ORDER BY sku`)
  ).rows;
  const promo = new Set<string>(NEON_PROMO.dealSkus);

  const plan = products
    .filter((p) => p.costPrice != null && !p.soldOut && p.fulfillment !== "STOCK" && !promo.has(p.sku))
    .map((p) => {
      const national = p.fulfillment !== "STOCK";
      const weight = p.weightKg ?? 1;
      const before = marginD(p.price, p.costPrice!, weight, national);
      let price = p.price;
      // Sube de a $1.000 (terminado en 900) hasta llegar al objetivo; al pasar $150.000 cambia el régimen de envío.
      if (before < P.target) {
        price = roundUp900(p.price);
        while (marginD(price, p.costPrice!, weight, national) < P.target) price += 1000;
      }
      return { ...p, before, price, after: marginD(price, p.costPrice!, weight, national), raise: price - p.price };
    })
    .filter((p) => p.raise > 0)
    .sort((a, b) => a.before - b.before);

  for (const p of plan) {
    const vsPublic = p.compareAtPrice ? ` · ${((p.price / p.compareAtPrice - 1) * 100).toFixed(0)}% vs público` : "";
    console.log(`${p.sku} ${p.name.slice(0, 46).padEnd(46)} ${p.price - p.raise} → ${p.price} (+${p.raise}) · margen ${(p.before * 100).toFixed(1)}% → ${(p.after * 100).toFixed(1)}%${vsPublic}`);
  }
  console.log(`\nSuben: ${plan.length} · subida promedio ${Math.round(plan.reduce((s, p) => s + p.raise, 0) / Math.max(1, plan.length))} COP`);

  if (apply) {
    const backup = "prisma/backups/precios-antes-ajuste-2026-10-10.json";
    mkdirSync("prisma/backups", { recursive: true });
    if (existsSync(backup)) throw new Error("Ya existe el respaldo: el ajuste ya se aplicó.");
    writeFileSync(backup, JSON.stringify(plan.map((p) => ({ sku: p.sku, id: p.id, before: p.price - p.raise, after: p.price, compareAtPrice: p.compareAtPrice })), null, 1));
    await db.query("BEGIN");
    for (const p of plan) {
      // El tachado solo se conserva si sigue por encima del precio nuevo (nunca un descuento falso).
      await db.query(`UPDATE "Product" SET price=$2, "compareAtPrice"=CASE WHEN "compareAtPrice" > $2 THEN "compareAtPrice" ELSE NULL END, "updatedAt"=now() WHERE id=$1 AND price=$3`, [p.id, p.price, p.price - p.raise]);
    }
    await db.query("COMMIT");
    console.log(`APLICADO: ${plan.length} precios (respaldo en ${backup}).`);
  }
  await db.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
