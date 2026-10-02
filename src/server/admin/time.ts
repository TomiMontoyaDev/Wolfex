/** Colombia no tiene horario de verano: UTC-5 fijo. */
const OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const STORE_TZ = "America/Bogota";

/** Inicio del día (hora Colombia) que contiene `date`, expresado en UTC. */
export function startOfDay(date = new Date()) {
  const local = new Date(date.getTime() - OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + OFFSET_MS);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function startOfMonth(date = new Date(), monthOffset = 0) {
  const local = new Date(date.getTime() - OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + monthOffset, 1) + OFFSET_MS);
}

/** "2026-10-02" interpretado como fecha de Colombia. */
export function parseLocalDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d) + OFFSET_MS);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Clave YYYY-MM-DD en hora Colombia. */
export function localDayKey(date: Date) {
  return new Date(date.getTime() - OFFSET_MS).toISOString().slice(0, 10);
}
