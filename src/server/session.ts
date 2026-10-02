/**
 * Token de sesión del admin: `<expiraEnMs>.<firmaHMAC>`.
 * Usa Web Crypto para funcionar igual en proxy.ts y en el servidor.
 * Cambiar ADMIN_SESSION_SECRET invalida todas las sesiones.
 */
export const ADMIN_COOKIE = "wfx_admin";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET debe tener al menos 32 caracteres.");
  return secret;
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`admin:${payload}`)));
  return btoa(String.fromCharCode(...signature)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(now = Date.now()) {
  const expires = String(now + SESSION_TTL_MS);
  return `${expires}.${await sign(expires)}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  try {
    return safeEqual(signature, await sign(expires));
  } catch {
    return false;
  }
}
