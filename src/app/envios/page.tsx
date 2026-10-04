import type { Metadata } from "next";
import { InfoPage } from "@/components/info/InfoPage";
import { FREE_SHIPPING_NATIONAL_MIN, FREE_SHIPPING_PEREIRA_MIN, LOCAL_CITY } from "@/config/shipping";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Envíos",
  description: `Envío gratis en ${LOCAL_CITY} desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)} y al resto de Colombia desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}. Entrega el mismo día en ${LOCAL_CITY}.`,
  alternates: { canonical: "/envios" },
};

export default function ShippingPage() {
  return (
    <InfoPage
      current="/envios"
      eyebrow="WOLFEX / Envíos"
      title="Envíos"
      intro={`Despachamos a toda Colombia. En ${LOCAL_CITY} entregamos el mismo día los productos que tenemos en stock físico.`}
      sections={[
        {
          title: "Envío gratis",
          body: [
            [
              `${LOCAL_CITY}: gratis en compras desde ${formatPrice(FREE_SHIPPING_PEREIRA_MIN)}.`,
              `Resto de Colombia: gratis en compras desde ${formatPrice(FREE_SHIPPING_NATIONAL_MIN)}.`,
              "Por debajo de esos montos, el envío se cobra según el producto y la localidad. [COMPLETAR: cómo se cobra — p. ej. se coordina por WhatsApp antes del despacho o pago contraentrega]",
            ],
          ],
        },
        {
          title: `Entrega HOY en ${LOCAL_CITY}`,
          body: [
            `Los productos marcados como “Entrega HOY en ${LOCAL_CITY}” los tenemos en físico. Si haces tu pedido antes de las [COMPLETAR: hora de corte, p. ej. 4:00 p. m.] de [COMPLETAR: días, p. ej. lunes a sábado], lo recibes el mismo día.`,
            "Pedidos después de la hora de corte, domingos o festivos: se entregan el siguiente día hábil.",
          ],
        },
        {
          title: "Envío nacional",
          body: [
            "Los productos marcados como “Envío nacional” los despacha nuestro aliado mayorista directamente desde su bodega.",
            [
              "Tiempo estimado: [COMPLETAR: p. ej. 2 a 5 días hábiles] después de confirmado el pago.",
              "Transportadora: [COMPLETAR: p. ej. Servientrega, Interrapidísimo, Coordinadora].",
              "Si tu pedido combina productos en stock y de envío nacional, puede llegar en paquetes separados.",
            ],
          ],
        },
        {
          title: "Seguimiento",
          body: ["Cuando tu pedido sale, te enviamos la guía de la transportadora a tu correo o WhatsApp para que lo rastrees. [COMPLETAR: confirmar el canal]"],
        },
        {
          title: "Antes de recibir",
          body: [
            [
              "Revisa que la caja y los sellos de seguridad de cada producto lleguen intactos.",
              "Si el paquete llega abierto o dañado, déjalo anotado con la transportadora y escríbenos el mismo día con fotos.",
              "Si no hay nadie para recibir, la transportadora hará [COMPLETAR: número] intentos de entrega.",
            ],
          ],
        },
      ]}
    />
  );
}
