import "server-only";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

let client: MercadoPagoConfig | undefined;

function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en el servidor.");
  client ??= new MercadoPagoConfig({
    accessToken,
    // integratorId identifica al desarrollador de la integración ante Mercado Pago (no es un secreto).
    options: { timeout: 10000, ...(process.env.MERCADOPAGO_INTEGRATOR_ID && { integratorId: process.env.MERCADOPAGO_INTEGRATOR_ID }) },
  });
  return client;
}

export const mpPreferences = () => new Preference(getClient());
export const mpPayments = () => new Payment(getClient());

export function siteUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
}
