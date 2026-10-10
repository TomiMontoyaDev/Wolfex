import type { Metadata } from "next";
import { InfoLink, InfoPage } from "@/components/info/InfoPage";
import {
  FREE_SHIPPING_NATIONAL_MIN,
  FREE_SHIPPING_PEREIRA_MIN,
  LOCAL_ZONE_LABEL,
  QUOTE_ONLY_DEPARTMENTS,
  SHIPPING_RATE_LOCAL,
  SHIPPING_RATE_NATIONAL,
  WEIGHT_SURCHARGE,
} from "@/config/shipping";
import { CONTACT } from "@/lib/site-config";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Envíos",
  description: `Envío gratis en Pereira y Dosquebradas desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)} y al resto de Colombia desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}. Entrega el mismo día en Pereira.`,
  alternates: { canonical: "/envios" },
};

const whatsapp = <InfoLink href={CONTACT.whatsapp.url}>WhatsApp</InfoLink>;

export default function ShippingPage() {
  return (
    <InfoPage
      current="/envios"
      eyebrow="WOLFEX / Envíos"
      title="Envíos"
      intro="Despachamos a toda Colombia. En Pereira entregamos el mismo día los productos que tenemos en stock físico."
      sections={[
        {
          title: "Costo del envío",
          body: [
            "El envío se paga junto con tu pedido y lo ves en el carrito y en el checkout antes de pagar.",
            [
              `${LOCAL_ZONE_LABEL}: ${formatPrice(SHIPPING_RATE_LOCAL)}. Gratis en compras desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)}.`,
              `Resto de Colombia: ${formatPrice(SHIPPING_RATE_NATIONAL)}. Gratis en compras desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}.`,
              `Pedidos de más de ${WEIGHT_SURCHARGE.includedKg} kg: ${formatPrice(WEIGHT_SURCHARGE.perKg)} por cada kg adicional (también con envío gratis).`,
              <>{QUOTE_ONLY_DEPARTMENTS.join(", ")}: el envío se cotiza según la dirección; escríbenos por {whatsapp} y te ayudamos con la compra.</>,
            ],
          ],
        },
        {
          title: "Entrega HOY en Pereira",
          body: [
            <>Los productos marcados como “Entrega HOY en Pereira” los tenemos en físico. Las entregas en Pereira se hacen de lunes a viernes después de las 5:00 p. m. Una vez confirmes tu pedido, te escribimos por {whatsapp} para coordinar la hora y el lugar de entrega.</>,
            "Los pedidos hechos los fines de semana o festivos se entregan el siguiente día hábil.",
          ],
        },
        {
          title: "Envío nacional",
          body: [
            "Los productos marcados como “Envío nacional” los despacha nuestro aliado mayorista directamente desde su bodega.",
            [
              "Tiempo estimado: de 2 a 5 días hábiles después de confirmado el pago.",
              "Transportadora: trabajamos con varias transportadoras (como Envía, Interrapidísimo, entre otras) y usamos la que mejor cubra tu ciudad.",
              "Si tu pedido combina productos en stock y de envío nacional, puede llegar en paquetes separados.",
            ],
          ],
        },
        {
          title: "Seguimiento",
          body: [<>Cuando tu pedido sale, te enviamos por {whatsapp} el número de guía y la transportadora para que lo rastrees en su página.</>],
        },
        {
          title: "Antes de recibir",
          body: [
            [
              "Revisa que la caja y los sellos de seguridad de cada producto lleguen intactos.",
              "Si el paquete llega abierto o dañado, déjalo anotado con la transportadora y escríbenos dentro de las 48 horas siguientes con fotos.",
              "Si no hay nadie para recibir, la transportadora hace normalmente hasta 2 intentos de entrega. Las condiciones exactas pueden variar según la transportadora; puedes consultarlas en su página con tu número de guía.",
            ],
          ],
        },
        {
          title: "¿Prefieres recoger?",
          body: [<>Si tu ciudad es Pereira, en el checkout puedes elegir “Recoger y pagar en Pereira” y coordinamos la hora y el lugar por {whatsapp}.</>],
        },
      ]}
    />
  );
}
