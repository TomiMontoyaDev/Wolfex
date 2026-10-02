import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, SESSION_TTL_MS, createSessionToken, verifySessionToken } from "./session";

export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Llamar al inicio de cada página y Server Action del admin (defensa en profundidad además de proxy.ts). */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export function checkAdminPassword(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 12) throw new Error("ADMIN_PASSWORD no está configurada (mínimo 12 caracteres).");
  // Comparar hashes de longitud fija evita filtrar la longitud y permite timingSafeEqual.
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function startAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endAdminSession() {
  const store = await cookies();
  store.delete({ name: ADMIN_COOKIE, path: "/admin" });
}

// Límite de intentos en memoria por IP. En serverless se reinicia con cada instancia,
// pero frena ataques de fuerza bruta simples; migrar a Redis/DB si el admin crece.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function loginRateLimited(ip: string) {
  const entry = attempts.get(ip);
  return Boolean(entry && entry.resetAt > Date.now() && entry.count >= MAX_ATTEMPTS);
}

export function registerFailedLogin(ip: string) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count++;
}

export function clearFailedLogins(ip: string) {
  attempts.delete(ip);
}
