/** Datos de contacto y del responsable de la tienda: una sola fuente para todo el sitio. */
export const CONTACT = {
  owner: "Tomás Montoya Buitrago",
  whatsapp: {
    display: "+57 301 565 5751",
    url: "https://wa.me/573015655751",
  },
  email: "tomasmontoyabuitrago@gmail.com",
  instagram: {
    handle: "@wolfexwear",
    url: "https://www.instagram.com/wolfex.col/?hl=es-la",
  },
  location: "Pereira, Risaralda, Colombia",
  city: "Pereira, Risaralda",
} as const;

/** Enlace de WhatsApp con un mensaje ya escrito. */
export function whatsappLink(message?: string) {
  return message ? `${CONTACT.whatsapp.url}?text=${encodeURIComponent(message)}` : CONTACT.whatsapp.url;
}
