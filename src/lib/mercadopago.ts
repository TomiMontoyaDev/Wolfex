import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

let client: MercadoPagoConfig | undefined;

function getClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN en el servidor.");
  client ??= new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
  return client;
}

export const preferences = () => new Preference(getClient());
export const payments = () => new Payment(getClient());

export function siteUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
}
