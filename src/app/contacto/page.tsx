import type { Metadata } from "next";
import { InfoPage } from "@/components/info/InfoPage";
import { SOCIALS } from "@/data/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp, correo o Instagram. Te ayudamos con tu pedido o a elegir tu suplemento.",
  alternates: { canonical: "/contacto" },
};

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
              "WhatsApp: [COMPLETAR: número, p. ej. +57 300 000 0000]",
              "Correo: [COMPLETAR: correo de atención]",
              "Horario de atención: [COMPLETAR: p. ej. lunes a sábado, 8:00 a. m. a 6:00 p. m.]",
              "Ubicación: Pereira, Risaralda. [COMPLETAR: dirección si tienes punto físico o de recogida]",
            ],
          ],
        },
        {
          title: "Sobre un pedido",
          body: ["Ten a mano tu número de pedido (empieza por WFX). Lo encuentras en el correo de confirmación y en la página de pago."],
        },
      ]}
    >
      <ul className="mt-8 flex flex-wrap gap-3">
        {SOCIALS.map((social) => (
          <li key={social.platform}>
            <a href={social.href} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center border border-line-strong px-5 type-title text-xs text-bone transition-colors hover:border-arc hover:text-arc">
              {social.label} · {social.handle}
            </a>
          </li>
        ))}
      </ul>
    </InfoPage>
  );
}
