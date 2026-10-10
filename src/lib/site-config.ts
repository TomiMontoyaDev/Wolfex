/**
 * Datos de contacto de la tienda: una sola fuente para todo el sitio.
 * Los números de WhatsApp van SOLO aquí (formato internacional, sin + ni espacios).
 */

/** Asesoría, dudas y coordinación de entregas o recogidas. */
export const WHATSAPP_ASESORIA = "573162268950";
/** Recepción de comprobantes de pago (transferencia o llave). */
export const WHATSAPP_PAGOS = "573162268950";

/** "573162268950" → "+57 316 226 8950". */
export function formatWhatsapp(number: string) {
  const local = number.replace(/^57/, "");
  return `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/**
 * Datos legales para el pie de página. Vacíos = no se muestran.
 * Completar con los datos reales (no inventar): razón social o nombre del responsable y NIT.
 */
export const LEGAL = {
  businessName: "",
  nit: "",
  city: "Pereira, Risaralda",
} as const;

export const CONTACT = {
  /** Responsable que se muestra (privacidad, comprobantes): la razón social si está; si no, la marca. */
  owner: LEGAL.businessName || "WOLFEX",
  whatsapp: {
    display: formatWhatsapp(WHATSAPP_ASESORIA),
    url: `https://wa.me/${WHATSAPP_ASESORIA}`,
  },
  email: "tomasmontoyabuitrago@gmail.com",
  instagram: {
    handle: "@wolfexwear",
    url: "https://www.instagram.com/wolfex.col/?hl=es-la",
  },
  location: "Pereira, Risaralda, Colombia",
  city: "Pereira, Risaralda",
} as const;

/** Enlace de WhatsApp con un mensaje ya escrito (por defecto, al número de asesoría). */
export function whatsappLink(message?: string, number: string = WHATSAPP_ASESORIA) {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
