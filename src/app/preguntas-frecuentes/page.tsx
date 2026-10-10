import type { Metadata } from "next";
import type { ReactNode } from "react";
import { InfoLink, InfoPage } from "@/components/info/InfoPage";
import { SHIPPING_SUMMARY } from "@/config/shipping";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Resolvemos tus dudas sobre pagos, envíos, productos originales, vencimientos y devoluciones en WOLFEX.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

const FAQ: Array<[string, ReactNode]> = [
  ["¿Los productos son originales?", "Sí. Compramos directamente a un distribuidor verificado a nivel nacional y todos los productos llegan sellados, con lote y fecha de vencimiento visibles."],
  ["¿Cómo puedo pagar?", "Con Mercado Pago (tarjeta de crédito o débito, PSE, Nequi y los demás medios que tenga disponibles) o por transferencia o llave (Bancolombia / Nequi / Bre-B): al confirmar el pedido te mostramos los datos y nos envías el comprobante por WhatsApp. En Pereira también puedes recoger y pagar. Tus datos de tarjeta nunca pasan por nuestros servidores."],
  ["¿Cuánto cuesta el envío?", `${SHIPPING_SUMMARY} Lo ves en el carrito y se paga junto con tu pedido.`],
  ["¿Cuánto se demora mi pedido?", "En Pereira, los productos marcados “Entrega HOY” se entregan de lunes a viernes después de las 5:00 p. m., y coordinamos contigo la entrega por WhatsApp. Los de envío nacional tardan de 2 a 5 días hábiles."],
  ["¿Puedo recoger mi pedido?", "Sí, en Pereira. En el checkout elige “Recoger y pagar en Pereira” y coordinamos la hora y el lugar por WhatsApp."],
  [
    "¿Los productos tienen registro INVIMA?",
    <>
      Sí. Puedes verificar el registro sanitario de cualquier producto en la{" "}
      <InfoLink href="https://consultaregistro.invima.gov.co/">consulta pública del INVIMA</InfoLink>, buscando por el nombre del producto o la marca.
    </>,
  ],
  ["¿Qué vencimiento tienen los productos?", "Despachamos productos con al menos 6 meses de vida útil. Si necesitas una fecha específica, escríbenos antes de comprar."],
  [
    "¿Puedo devolver o cambiar un producto?",
    <>
      Sí, si está sellado. Tienes 5 días hábiles para el derecho de retracto o para pedir un cambio de sabor o presentación (en el cambio, el envío lo asumes tú). Si llegó dañado, equivocado o vencido, escríbenos dentro de las 48 horas siguientes a recibirlo. Mira los detalles en{" "}
      <InfoLink href="/devoluciones">Cambios y devoluciones</InfoLink>.
    </>,
  ],
  ["¿Cómo sé qué suplemento me sirve?", "En cada producto, “Ver más” explica para qué sirve. Si tienes dudas, escríbenos y te ayudamos a elegir. Si tienes alguna condición médica, consulta a tu médico antes de tomar suplementos."],
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
