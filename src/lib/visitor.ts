/**
 * Identificador anónimo del visitante (cookie propia, 1 año). No contiene datos personales:
 * es un UUID aleatorio que Meta recibe en SHA-256 como `external_id` para reconocer al mismo
 * visitante entre eventos y mejorar la calidad de coincidencia.
 */
export const VISITOR_COOKIE = "wfx_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Navegador: devuelve el id del visitante y lo crea si no existe. */
export function ensureVisitorId(): string | null {
  if (typeof document === "undefined") return null;
  const existing = document.cookie.match(new RegExp(`(?:^|; )${VISITOR_COOKIE}=([^;]+)`))?.[1];
  if (existing) return existing;
  const id = crypto.randomUUID();
  document.cookie = `${VISITOR_COOKIE}=${id}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return id;
}

/** Servidor: valida el formato antes de usar la cookie (nunca se confía en lo que manda el navegador). */
export function parseVisitorId(value: string | undefined | null): string | null {
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}
