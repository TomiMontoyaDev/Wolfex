import type { Metadata } from "next";
import { InfoLink, InfoPage } from "@/components/info/InfoPage";
import { CONTACT } from "@/lib/site-config";

/** Responsable del tratamiento de datos (Ley 1581): persona natural mientras no haya razón social/NIT. */
const RESPONSIBLE = { name: "Tomás Montoya", document: "C.C. 1089600231" } as const;

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo WOLFEX recolecta, usa y protege tus datos personales, de acuerdo con la Ley 1581 de 2012.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      current="/privacidad"
      eyebrow="WOLFEX / Privacidad"
      title="Política de privacidad"
      intro="Tratamos tus datos personales de acuerdo con la Ley 1581 de 2012 y el Decreto 1377 de 2013 (protección de datos personales en Colombia)."
      sections={[
        {
          title: "Responsable del tratamiento",
          body: [
            `${RESPONSIBLE.name}, ${RESPONSIBLE.document}. ${CONTACT.location}.`,
            <>
              Correo: <InfoLink href={`mailto:${CONTACT.email}`}>{CONTACT.email}</InfoLink> · WhatsApp: <InfoLink href={CONTACT.whatsapp.url}>{CONTACT.whatsapp.display}</InfoLink>.
            </>,
          ],
        },
        {
          title: "Qué datos recolectamos",
          body: [
            [
              "Los que nos das al comprar: nombre, correo, teléfono, departamento, ciudad y dirección de entrega.",
              "Los datos de contacto y entrega que escribes en el checkout, junto con los productos de tu carrito, se guardan aunque no termines el pago, para poder ayudarte a completar tu compra.",
              "Datos del pedido: productos, valores y estado del pago. Los datos de tu tarjeta los procesa Mercado Pago; nosotros no los vemos ni los guardamos.",
              "Datos de navegación anónimos y agregados (páginas visitadas, tipo de dispositivo), para mejorar la tienda.",
            ],
          ],
        },
        {
          title: "Para qué los usamos",
          body: [
            [
              "Procesar, despachar y hacer seguimiento a tus pedidos.",
              "Contactarte sobre tu compra (confirmaciones, envío, cambios) o, si la dejaste a mitad de camino, para ayudarte a completarla.",
              "Cumplir obligaciones legales, contables y tributarias.",
              "Enviarte ofertas solo si lo autorizas; puedes darte de baja cuando quieras.",
            ],
          ],
        },
        {
          title: "Con quién los compartimos",
          body: [
            "No vendemos tus datos. Solo los compartimos con quienes nos ayudan a operar la tienda, y únicamente lo necesario:",
            [
              "Mercado Pago, para procesar el pago.",
              "La transportadora y nuestro aliado mayorista, para entregar tu pedido.",
              "Proveedores de tecnología que alojan la tienda y la base de datos (Vercel, Neon).",
              "Meta (Facebook e Instagram), para medir y mejorar nuestros anuncios mediante el píxel de Meta y su API de Conversiones. Tu correo, teléfono, nombre y ciudad se envían convertidos en un código irreversible (hash SHA-256), nunca en texto plano.",
            ],
          ],
        },
        {
          title: "Tus derechos",
          body: [
            "Puedes conocer, actualizar, rectificar y pedir que eliminemos tus datos, revocar la autorización y presentar quejas ante la Superintendencia de Industria y Comercio.",
            <>
              Para ejercerlos, escríbenos a <InfoLink href={`mailto:${CONTACT.email}`}>{CONTACT.email}</InfoLink>. Respondemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles.
            </>,
          ],
        },
        {
          title: "Seguridad y conservación",
          body: ["Guardamos tus datos en servidores con conexión cifrada y acceso restringido, durante el tiempo necesario para las finalidades descritas y lo que exija la ley."],
        },
        {
          title: "Vigencia",
          body: ["Esta política rige desde el 5 de octubre de 2026. Si la cambiamos, publicaremos la nueva versión en esta página."],
        },
      ]}
    />
  );
}
