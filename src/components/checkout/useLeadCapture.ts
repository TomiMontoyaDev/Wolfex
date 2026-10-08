"use client";

import { useCallback, useEffect, useRef } from "react";

const TOKEN_KEY = "wfx_lead";
const DEBOUNCE_MS = 1200;

export interface LeadDraft {
  name: string;
  email: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  lines: { productId: string; quantity: number }[];
}

// Token propio de este navegador: solo él puede actualizar el posible cliente que creó.
function leadToken() {
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    return null;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isUsable = (draft: LeadDraft) => EMAIL.test(draft.email.trim()) || draft.phone.replace(/\D/g, "").length >= 7;

/**
 * Guarda (con espera de 1,2 s) lo que el cliente escribe en el checkout como "posible cliente" del panel.
 * Solo envía cuando hay un correo o teléfono válido y algo cambió. `flush()` envía ya lo pendiente.
 */
export function useLeadCapture(draft: LeadDraft) {
  const lastSent = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const send = useCallback(async (value: LeadDraft) => {
    const token = leadToken();
    if (!token || !isUsable(value)) return;
    const body = JSON.stringify({ token, ...value, email: EMAIL.test(value.email.trim()) ? value.email.trim() : "" });
    if (body === lastSent.current) return;
    lastSent.current = body;
    await fetch("/api/checkout/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {
      lastSent.current = ""; // se reintenta en el próximo cambio
    });
  }, []);

  const latest = useRef(draft);
  const key = JSON.stringify(draft);
  useEffect(() => {
    latest.current = draft;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void send(latest.current), DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` resume el contenido de `draft`
  }, [key, send]);

  // Si cierra la pestaña o se va antes de la espera, se envía lo que alcanzó a escribir.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && void send(latest.current);
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [send]);

  return useCallback(() => {
    clearTimeout(timer.current);
    return send(latest.current);
  }, [send]);
}
