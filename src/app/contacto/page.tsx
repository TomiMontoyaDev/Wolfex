import type { Metadata } from "next";
import { InfoLink, InfoPage } from "@/components/info/InfoPage";
import { CONTACT } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Escríbenos por WhatsApp (${CONTACT.whatsapp.display}), correo o Instagram. Te ayudamos con tu pedido o a elegir tu suplemento.`,
  alternates: { canonical: "/contacto" },
};

const buttonClass =
  "inline-flex h-12 items-center border border-line-strong px-5 type-title text-xs text-bone transition-colors hover:border-arc hover:text-arc";

export default function ContactPage() {
  return (
    <InfoPage
      current="/contacto"
      eyebrow="WOLFEX / Contacto"
      title="Contacto"
      intro="¿Dudas con tu pedido o con qué suplemento elegir? Escríbenos y te respondemos."
      sections={[
        {
          title: "Canales",
          body: [
            [
              <>
                WhatsApp: <InfoLink href={CONTACT.whatsapp.url}>{CONTACT.whatsapp.display}</InfoLink>
              </>,
              <>
                Correo: <InfoLink href={`mailto:${CONTACT.email}`}>{CONTACT.email}</InfoLink>
              </>,
              <>
                Instagram: <InfoLink href={CONTACT.instagram.url}>{CONTACT.instagram.handle}</InfoLink>
              </>,
              "Ubicación: Pereira, Risaralda. Entregas y recogidas se coordinan por WhatsApp.",
            ],
          ],
        },
      ]}
    >
      <ul className="mt-8 flex flex-wrap gap-3">
        <li>
          <a href={CONTACT.whatsapp.url} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center bg-volt px-5 type-title text-xs text-bone transition-colors hover:bg-arc hover:text-void">
            Escribir por WhatsApp
          </a>
        </li>
        <li>
          <a href={`mailto:${CONTACT.email}`} className={buttonClass}>
            Enviar correo
          </a>
        </li>
        <li>
          <a href={CONTACT.instagram.url} target="_blank" rel="noreferrer" className={buttonClass}>
            Instagram · {CONTACT.instagram.handle}
          </a>
        </li>
      </ul>
    </InfoPage>
  );
}
