import type { Metadata } from "next";
import type { ReactNode } from "react";
import { InfoLink, InfoPage } from "@/components/info/InfoPage";
import { FREE_SHIPPING_NATIONAL_MIN, FREE_SHIPPING_PEREIRA_MIN } from "@/config/shipping";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Resolvemos tus dudas sobre pagos, envíos, productos originales, vencimientos, devoluciones y facturas en WOLFEX.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

const FAQ: Array<[string, ReactNode]> = [
  ["¿Los productos son originales?", "Sí. Compramos directamente a un distribuidor verificado a nivel nacional y todos los productos llegan sellados, con lote y fecha de vencimiento visibles."],
  ["¿Cómo puedo pagar?", "Con Mercado Pago: tarjeta de crédito o débito, PSE y los demás medios que Mercado Pago tenga disponibles al pagar. Tus datos de tarjeta nunca pasan por nuestros servidores."],
  ["¿Cuánto cuesta el envío?", `Es gratis en Pereira desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)} y al resto de Colombia desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}. Por debajo de esos montos, te confirmamos el valor por WhatsApp antes de despachar.`],
  ["¿Cuánto se demora mi pedido?", "En Pereira, los productos marcados “Entrega HOY” se entregan de lunes a viernes después de las 5:00 p. m., y coordinamos contigo la entrega por WhatsApp. Los de envío nacional tardan de 2 a 5 días hábiles."],
  ["¿Puedo recoger mi pedido?", "Sí. Puedes recogerlo en Pereira coordinando previamente con nosotros por WhatsApp."],
  ["¿Qué vencimiento tienen los productos?", "Despachamos productos con al menos 6 meses de vida útil. Si necesitas una fecha específica, escríbenos antes de comprar."],
  [
    "¿Puedo devolver o cambiar un producto?",
    <>
      Sí, si está sellado. Tienes 5 días hábiles para el derecho de retracto o para pedir un cambio de sabor o presentación (en el cambio, el envío lo asumes tú). Si llegó dañado, equivocado o vencido, escríbenos dentro de las 48 horas siguientes a recibirlo. Mira los detalles en{" "}
      <InfoLink href="/devoluciones">Cambios y devoluciones</InfoLink>.
    </>,
  ],
  ["¿Cómo sé qué suplemento me sirve?", "En cada producto, “Ver más” explica para qué sirve. Si tienes dudas, escríbenos y te ayudamos a elegir. Si tienes alguna condición médica, consulta a tu médico antes de tomar suplementos."],
  [
    "¿Entregan factura?",
    "Sí. Puedes pedir factura electrónica marcando la opción “Necesito factura electrónica” al hacer tu pedido, o escribiéndonos por WhatsApp con tu número de pedido. Necesitamos: nombre completo o razón social, tipo y número de documento (cédula o NIT), correo electrónico para recibir la factura, dirección, ciudad y teléfono.",
  ],
];

export default function FaqPage() {
  return (
    <InfoPage
      current="/preguntas-frecuentes"
      eyebrow="WOLFEX / Ayuda"
      title="Preguntas frecuentes"
      intro="Lo que más nos preguntan. Si no encuentras tu respuesta, escríbenos."
      sections={FAQ.map(([question, answer]) => ({ title: question, body: [answer] }))}
    />
  );
}
