/** Unidad del nombre del producto → cómo se muestra (singular, plural). */
const UNITS: Array<[RegExp, string, string]> = [
  [/^LIBRAS?$/, "libra", "libras"],
  [/^SERVIC?I?OS$/, "servicio", "servicios"],
  [/^PORCIONES$/, "porción", "porciones"],
  [/^GRAMOS$/, "g", "g"],
  [/^KILOS?$/, "kg", "kg"],
  [/^CAPSULAS$/, "cápsula", "cápsulas"],
  [/^TABLETAS$/, "tableta", "tabletas"],
  [/^PERLAS$/, "perla", "perlas"],
  [/^SOFT?GELS$/, "softgel", "softgels"],
  [/^(SACHETS|SOBRES)$/, "sobre", "sobres"],
  [/^UNIDADES$/, "unidad", "unidades"],
  [/^ONZAS$/, "oz", "oz"],
  [/^MILILITROS$/, "ml", "ml"],
  [/^MG$/, "mg", "mg"],
  [/^IU$/, "UI", "UI"],
];

const SIZE_PATTERN = /(?:\bX\s?)?(\d+(?:[.,]\d+)?)\s*(LIBRAS?|SERVICIOS|SERVICOS|PORCIONES|GRAMOS|KILOS?|CAPSULAS|TABLETAS|PERLAS|SOFTGELS|SOFGELS|SACHETS|SOBRES|UNIDADES|ONZAS|MILILITROS|MG|IU)\b/g;

/**
 * Contenido/tamaño a partir del nombre ("CREATINE UNIVERSAL 60 SERVICIOS 300 GRAMOS" → ["60 servicios", "300 g"]).
 * Los nombres del catálogo siempre traen la presentación, así que no hace falta un campo aparte.
 */
export function productSize(name: string): string[] {
  const sizes: string[] = [];
  for (const [, rawAmount, rawUnit] of name.toUpperCase().matchAll(SIZE_PATTERN)) {
    const unit = UNITS.find(([pattern]) => pattern.test(rawUnit));
    if (!unit) continue;
    const amount = rawAmount.replace(".", ",");
    const label = `${amount} ${amount === "1" ? unit[1] : unit[2]}`;
    if (!sizes.includes(label)) sizes.push(label);
  }
  return sizes;
}
