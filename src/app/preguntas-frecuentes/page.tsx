import type { Metadata } from "next";
import { InfoPage } from "@/components/info/InfoPage";
import { FREE_SHIPPING_NATIONAL_MIN, FREE_SHIPPING_PEREIRA_MIN, LOCAL_CITY } from "@/config/shipping";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Resolvemos tus dudas sobre pagos, envíos, productos originales, vencimientos y devoluciones en WOLFEX.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

const FAQ: Array<[string, string]> = [
  ["¿Los productos son originales?", "Sí. Compramos directamente a [COMPLETAR: nombre del distribuidor autorizado] y todos los productos llegan sellados, con lote y fecha de vencimiento visibles."],
  ["¿Cómo puedo pagar?", "Con Mercado Pago: tarjeta de crédito o débito, PSE y los demás medios que Mercado Pago tenga disponibles al pagar. Tus datos de tarjeta nunca pasan por nuestros servidores."],
  ["¿Cuánto cuesta el envío?", `Es gratis en ${LOCAL_CITY} desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)} y al resto de Colombia desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}. Por debajo de esos montos se cobra según el producto y la localidad.`],
  ["¿Cuánto se demora mi pedido?", `En ${LOCAL_CITY}, los productos marcados “Entrega HOY” llegan el mismo día si pides antes de las [COMPLETAR: hora de corte]. Los de envío nacional tardan [COMPLETAR: p. ej. 2 a 5 días hábiles].`],
  ["¿Puedo recoger mi pedido?", "[COMPLETAR: ¿hay punto de recogida en Pereira? dirección y horario]"],
  ["¿Qué vencimiento tienen los productos?", "Despachamos productos con al menos [COMPLETAR: p. ej. 6 meses] de vida útil. Si necesitas una fecha específica, escríbenos antes de comprar."],
  ["¿Puedo devolver un producto?", "Sí, si está sellado y dentro de los 5 días hábiles del derecho de retracto. Mira los detalles en Cambios y devoluciones."],
  ["¿Cómo sé qué suplemento me sirve?", "En cada producto, “Ver más” explica para qué sirve. Si tienes dudas, escríbenos y te ayudamos a elegir. Si tienes alguna condición médica, consulta a tu médico antes de tomar suplementos."],
  ["¿Entregan factura?", "[COMPLETAR: ¿emites factura electrónica? cómo pedirla]"],
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
