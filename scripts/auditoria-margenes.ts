/**
 * Auditoría de márgenes (solo lectura: NO cambia precios).
 *   npx tsx scripts/auditoria-margenes.ts
 * Genera reports/auditoria-margenes.xlsx con fórmulas que dependen de la hoja "Parámetros":
 * cambias un parámetro en Excel y todo se recalcula.
 *
 * Fuente: tabla Product (precio de venta y costo mayorista `costPrice`, cargado de la lista de Power Nutrition).
 */
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ExcelJS from "exceljs";
import { estimateWeightKg } from "../src/lib/pricing";

const PARAMS = {
  pct: 0.0329, // comisión Mercado Pago (%)
  fixed: 800, // comisión Mercado Pago fija (COP)
  iva: 0.19, // IVA sobre la comisión porcentual
  perKg: 11_100, // envío nacional por kg (COP)
  target: 0.15, // margen neto objetivo
  green: 0.2, // umbral VERDE
};

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);

async function main() {
  const pg = createRequire(process.cwd() + "/")("pg");
  const db = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 20_000 });
  await db.connect();
  const rows: Array<{ sku: string; name: string; category: string | null; price: number; costPrice: number | null; fulfillment: string | null; weightKg: number | null }> = (
    await db.query(`SELECT sku, name, category, price, "costPrice", fulfillment, "weightKg" FROM "Product" WHERE active ORDER BY sku`)
  ).rows;
  await db.end();

  // Mismas cuentas que las fórmulas del Excel (para el resumen y el reporte en consola).
  const calc = rows.map((p) => {
    const weight = p.weightKg ?? estimateWeightKg(p.name, p.category);
    const national = p.fulfillment !== "STOCK";
    const cost = p.costPrice;
    const commission = p.price * PARAMS.pct * (1 + PARAMS.iva) + PARAMS.fixed;
    const shipping = national ? Math.ceil(weight) * PARAMS.perKg : 0;
    const marginA = cost == null ? null : p.price - cost - commission - shipping;
    const marginB = cost == null ? null : p.price - cost - shipping;
    const pctA = marginA == null ? null : marginA / p.price;
    const minPrice = cost == null ? null : Math.ceil(((cost + shipping + PARAMS.fixed) / (1 - PARAMS.pct * (1 + PARAMS.iva) - PARAMS.target) - 900) / 1000) * 1000 + 900;
    const status = marginA == null ? "SIN COSTO" : marginA < 0 ? "NEGRO" : pctA! < PARAMS.target ? "ROJO" : pctA! < PARAMS.green ? "AMARILLO" : "VERDE";
    return { ...p, weight, weightEstimated: p.weightKg == null, national, commission, shipping, marginA, marginB, pctA, minPrice, status };
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "WOLFEX";

  // ── Parámetros ──
  const params = wb.addWorksheet("Parámetros");
  params.columns = [{ width: 42 }, { width: 14 }, { width: 70 }];
  params.addRow(["Parámetro", "Valor", "Nota"]).font = { bold: true };
  const paramRows: Array<[string, number, string, string]> = [
    ["Comisión Mercado Pago (%)", PARAMS.pct, "0.00%", "Porcentaje por pago"],
    ["Comisión Mercado Pago fija (COP)", PARAMS.fixed, "#,##0", "Valor fijo por pago"],
    ["IVA sobre la comisión (%)", PARAMS.iva, "0%", "Se aplica a la comisión porcentual"],
    ["Envío nacional por kg (COP)", PARAMS.perKg, "#,##0", "Se cobra por kilo iniciado (peso redondeado hacia arriba)"],
    ["Margen neto objetivo (%)", PARAMS.target, "0%", "Debajo de este valor: ROJO. También define el precio mínimo"],
    ["Umbral VERDE (%)", PARAMS.green, "0%", "Desde este valor: VERDE"],
  ];
  for (const [label, value, fmt, note] of paramRows) {
    const row = params.addRow([label, value, note]);
    row.getCell(2).numFmt = fmt;
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
  }
  params.addRow([]);
  params.addRow(["Las celdas amarillas son editables. Todas las fórmulas de la hoja Productos dependen de ellas."]);
  const P = { pct: "Parámetros!$B$2", fixed: "Parámetros!$B$3", iva: "Parámetros!$B$4", perKg: "Parámetros!$B$5", target: "Parámetros!$B$6", green: "Parámetros!$B$7" };

  // ── Productos ──
  const sheet = wb.addWorksheet("Productos", { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });
  sheet.columns = [
    { header: "Código", key: "sku", width: 10 },
    { header: "Producto", key: "name", width: 52 },
    { header: "Categoría", key: "category", width: 22 },
    { header: "Peso (kg)", key: "weight", width: 10 },
    { header: "Entrega", key: "delivery", width: 16 },
    { header: "Costo mayorista", key: "cost", width: 15 },
    { header: "Precio de venta", key: "price", width: 15 },
    { header: "Comisión MP", key: "commission", width: 13 },
    { header: "Envío estimado", key: "shipping", width: 14 },
    { header: "Margen A $ (MP + envío gratis)", key: "ma", width: 18 },
    { header: "Margen A %", key: "mapct", width: 11 },
    { header: "Margen B $ (transferencia + envío gratis)", key: "mb", width: 20 },
    { header: "Margen B %", key: "mbpct", width: 11 },
    { header: "Precio mínimo 15%", key: "min", width: 15 },
    { header: "Estado", key: "status", width: 12 },
    { header: "Subida para llegar al objetivo", key: "raise", width: 16 },
    { header: "Peso estimado", key: "estimated", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1428" } };
  sheet.getRow(1).alignment = { wrapText: true, vertical: "middle" };
  sheet.getRow(1).height = 32;

  const rowOf = new Map<string, number>();
  calc.forEach((p, index) => {
    const r = index + 2;
    rowOf.set(p.sku, r);
    const hasCost = p.costPrice != null;
    sheet.addRow({
      sku: p.sku,
      name: p.name,
      category: p.category ?? "",
      weight: Math.round(p.weight * 100) / 100,
      delivery: p.national ? "Envío nacional" : "Stock Pereira",
      cost: p.costPrice ?? "",
      price: p.price,
      commission: { formula: `G${r}*${P.pct}*(1+${P.iva})+${P.fixed}`, result: p.commission },
      shipping: { formula: `IF(E${r}="Envío nacional",ROUNDUP(D${r},0)*${P.perKg},0)`, result: p.shipping },
      ma: hasCost ? { formula: `G${r}-F${r}-H${r}-I${r}`, result: p.marginA } : "",
      mapct: hasCost ? { formula: `J${r}/G${r}`, result: p.pctA } : "",
      mb: hasCost ? { formula: `G${r}-F${r}-I${r}`, result: p.marginB } : "",
      mbpct: hasCost ? { formula: `L${r}/G${r}`, result: p.marginB! / p.price } : "",
      min: hasCost ? { formula: `CEILING((F${r}+I${r}+${P.fixed})/(1-${P.pct}*(1+${P.iva})-${P.target})-900,1000)+900`, result: p.minPrice } : "",
      status: hasCost
        ? { formula: `IF(J${r}<0,"NEGRO",IF(K${r}<${P.target},"ROJO",IF(K${r}<${P.green},"AMARILLO","VERDE")))`, result: p.status }
        : "SIN COSTO",
      raise: hasCost ? { formula: `MAX(0,N${r}-G${r})`, result: Math.max(0, p.minPrice! - p.price) } : "",
      estimated: p.weightEstimated ? "Sí" : "No",
    });
  });
  const last = calc.length + 1;
  for (const col of ["F", "G", "H", "I", "J", "L", "N", "P"]) sheet.getColumn(col).numFmt = '"$"#,##0';
  for (const col of ["K", "M"]) sheet.getColumn(col).numFmt = "0.0%";
  sheet.autoFilter = { from: "A1", to: `Q${last}` };
  const colors: Record<string, string> = { VERDE: "FFC6EFCE", AMARILLO: "FFFFEB9C", ROJO: "FFFFC7CE", NEGRO: "FF404040" };
  sheet.addConditionalFormatting({
    ref: `O2:O${last}`,
    rules: Object.entries(colors).map(([value, argb], priority) => ({
      type: "containsText",
      operator: "containsText",
      text: value,
      priority: priority + 1,
      style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb } }, font: value === "NEGRO" ? { color: { argb: "FFFFFFFF" }, bold: true } : { bold: true } },
    })),
  });

  // ── Resumen ──
  const summary = wb.addWorksheet("Resumen");
  summary.columns = [{ width: 12 }, { width: 52 }, { width: 15 }, { width: 15 }, { width: 13 }, { width: 16 }];
  summary.addRow(["Productos por estado (se recalcula con los parámetros)"]).font = { bold: true, size: 13 };
  for (const status of ["VERDE", "AMARILLO", "ROJO", "NEGRO", "SIN COSTO"]) {
    summary.addRow([status, { formula: `COUNTIF(Productos!O2:O${last},"${status}")`, result: calc.filter((p) => p.status === status).length }]);
  }
  summary.addRow(["Total", { formula: `COUNTA(Productos!A2:A${last})`, result: calc.length }]).font = { bold: true };
  summary.addRow([]);

  const worst = calc.filter((p) => p.pctA != null).sort((a, b) => a.pctA! - b.pctA!).slice(0, 20);
  summary.addRow(["Los 20 con peor margen (escenario A) — la lista se arma al generar; los valores se recalculan"]).font = { bold: true, size: 13 };
  summary.addRow(["Código", "Producto", "Precio", "Margen A $", "Margen A %", "Estado"]).font = { bold: true };
  for (const p of worst) {
    const r = rowOf.get(p.sku)!;
    const row = summary.addRow([
      p.sku,
      p.name,
      { formula: `Productos!G${r}`, result: p.price },
      { formula: `Productos!J${r}`, result: p.marginA },
      { formula: `Productos!K${r}`, result: p.pctA },
      { formula: `Productos!O${r}`, result: p.status },
    ]);
    row.getCell(3).numFmt = '"$"#,##0';
    row.getCell(4).numFmt = '"$"#,##0';
    row.getCell(5).numFmt = "0.0%";
  }
  summary.addRow([]);

  const red = calc.filter((p) => p.status === "ROJO" || p.status === "NEGRO").sort((a, b) => a.pctA! - b.pctA!);
  summary.addRow([`Productos en ROJO o NEGRO (${red.length}): cuánto subiría el precio para llegar al objetivo`]).font = { bold: true, size: 13 };
  summary.addRow(["Código", "Producto", "Precio actual", "Precio mínimo", "Subida $", "Subida %"]).font = { bold: true };
  for (const p of red) {
    const r = rowOf.get(p.sku)!;
    const row = summary.addRow([
      p.sku,
      p.name,
      { formula: `Productos!G${r}`, result: p.price },
      { formula: `Productos!N${r}`, result: p.minPrice },
      { formula: `Productos!P${r}`, result: Math.max(0, p.minPrice! - p.price) },
      { formula: `IF(Productos!G${r}>0,Productos!P${r}/Productos!G${r},0)`, result: Math.max(0, p.minPrice! - p.price) / p.price },
    ]);
    for (const c of [3, 4, 5]) row.getCell(c).numFmt = '"$"#,##0';
    row.getCell(6).numFmt = "0.0%";
  }

  // Hojas en orden: Resumen primero.
  wb.worksheets.sort((a, b) => ["Resumen", "Productos", "Parámetros"].indexOf(a.name) - ["Resumen", "Productos", "Parámetros"].indexOf(b.name));
  mkdirSync("reports", { recursive: true });
  await wb.xlsx.writeFile("reports/auditoria-margenes.xlsx");

  const count = (s: string) => calc.filter((p) => p.status === s).length;
  console.log(`Productos activos: ${calc.length} · VERDE ${count("VERDE")} · AMARILLO ${count("AMARILLO")} · ROJO ${count("ROJO")} · NEGRO ${count("NEGRO")} · SIN COSTO ${count("SIN COSTO")}`);
  const rojos = calc.filter((p) => p.status === "ROJO");
  console.log(`ROJO por rango: 14-15% ${rojos.filter((p) => p.pctA! >= 0.14).length} · 12-14% ${rojos.filter((p) => p.pctA! >= 0.12 && p.pctA! < 0.14).length} · 10-12% ${rojos.filter((p) => p.pctA! >= 0.1 && p.pctA! < 0.12).length} · < 10% ${rojos.filter((p) => p.pctA! < 0.1).length}`);
  console.log(`Subida promedio de los ROJO para llegar al objetivo: ${Math.round(rojos.reduce((s, p) => s + (p.minPrice! - p.price), 0) / Math.max(1, rojos.length))} COP`);
  console.log(`Peso estimado (sin peso registrado): ${calc.filter((p) => p.weightEstimated).length}`);
  console.log("10 más graves:");
  for (const p of red.slice(0, 10)) {
    console.log(`${p.sku} | ${p.name} | ${p.national ? "nacional" : "stock"} | ${p.weight.toFixed(2)} kg | costo ${p.costPrice} | precio ${p.price} | margen A ${Math.round(p.marginA!)} (${(p.pctA! * 100).toFixed(1)}%) | ${p.status} | mínimo ${p.minPrice}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
