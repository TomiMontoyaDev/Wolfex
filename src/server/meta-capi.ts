import "server-only";
import { createHash } from "node:crypto";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

/**
 * API de Conversiones de Meta (eventos enviados desde el servidor).
 * Complementa el Pixel del navegador: llega aunque el cliente use bloqueador de anuncios, y Meta
 * deduplica ambos por event_name + event_id.
 */

const GRAPH_URL = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;

export type MetaServerEvent = "ViewContent" | "AddToCart" | "InitiateCheckout" | "AddPaymentInfo" | "Purchase";

export interface CapiContent {
  id: string;
  quantity: number;
  item_price: number;
}

export interface CapiCustomer {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  city?: string | null;
  department?: string | null;
}

export interface CapiRequestContext {
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  /** Id anónimo del visitante (cookie wfx_vid): se envía en SHA-256 como external_id. */
  visitorId?: string | null;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const stripAccents = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "");
/** Minúsculas, sin tildes, sin espacios ni signos: formato que pide Meta para nombre, ciudad y departamento. */
const compact = (value: string) => stripAccents(value).toLowerCase().replace(/[^a-z0-9ñ]/g, "");

/** Teléfono colombiano solo con dígitos y el indicativo 57 (3001234567 → 573001234567). */
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith("57")) return digits;
  return digits.length >= 8 ? digits : null;
}

/** user_data con los datos personales normalizados y en SHA-256 (nunca salen en claro hacia Meta). */
function buildUserData(customer: CapiCustomer | undefined, context: CapiRequestContext) {
  const hashed = (value: string | null | undefined) => (value ? [sha256(value)] : undefined);
  const [first, ...rest] = (customer?.name ?? "").trim().split(/\s+/);
  const email = customer?.email?.trim().toLowerCase();

  const userData: Record<string, unknown> = {
    client_ip_address: context.ip || undefined,
    client_user_agent: context.userAgent || undefined,
    fbp: context.fbp || undefined,
    fbc: context.fbc || undefined,
    external_id: hashed(context.visitorId),
    em: hashed(email),
    ph: hashed(customer?.phone ? normalizePhone(customer.phone) : null),
    fn: hashed(first ? compact(first) : null),
    ln: hashed(rest.length ? compact(rest.join("")) : null),
    ct: hashed(customer?.city ? compact(customer.city) : null),
    st: hashed(customer?.department ? compact(customer.department) : null),
    country: customer ? [sha256("co")] : undefined,
  };
  return Object.fromEntries(Object.entries(userData).filter(([, value]) => value !== undefined && value !== ""));
}

/**
 * Envía un evento a la API de Conversiones. Nunca lanza: si Meta falla, se registra en consola
 * y la compra o navegación del cliente sigue normal. Devuelve true si Meta lo recibió.
 */
export async function sendMetaEvent(input: {
  eventName: MetaServerEvent;
  eventId: string;
  eventSourceUrl: string;
  contents: CapiContent[];
  value?: number;
  customer?: CapiCustomer;
  context: CapiRequestContext;
  /** Momento real del evento (p. ej. la hora del pago); por defecto, ahora. */
  eventTime?: Date;
}): Promise<boolean> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.warn("[meta-capi] META_CAPI_TOKEN no está configurado; evento omitido", input.eventName);
    return false;
  }

  const value = input.value ?? input.contents.reduce((sum, item) => sum + item.item_price * item.quantity, 0);
  const event = {
    event_name: input.eventName,
    event_time: Math.floor((input.eventTime ?? new Date()).getTime() / 1000),
    event_id: input.eventId,
    action_source: "website",
    event_source_url: input.eventSourceUrl,
    user_data: buildUserData(input.customer, input.context),
    custom_data: {
      currency: "COP",
      value,
      content_ids: input.contents.map((item) => item.id),
      content_type: "product",
      contents: input.contents,
      num_items: input.contents.reduce((sum, item) => sum + item.quantity, 0),
    },
  };
  const testCode = process.env.META_TEST_EVENT_CODE;
  const body = { data: [event], ...(testCode && { test_event_code: testCode }) };

  try {
    const response = await fetch(`${GRAPH_URL}?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const result = (await response.json().catch(() => null)) as { events_received?: number; fbtrace_id?: string; error?: { message?: string; code?: number } } | null;
    if (!response.ok) {
      console.error("[meta-capi] Meta rechazó el evento", { event: input.eventName, eventId: input.eventId, status: response.status, error: result?.error });
      return false;
    }
    console.log("[meta-capi] evento enviado", { event: input.eventName, eventId: input.eventId, received: result?.events_received, test: !!testCode, fbtrace_id: result?.fbtrace_id });
    return true;
  } catch (error) {
    console.error("[meta-capi] no se pudo contactar a Meta", { event: input.eventName, eventId: input.eventId, error: error instanceof Error ? error.message : error });
    return false;
  }
}
