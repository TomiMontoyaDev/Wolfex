import type { Metadata } from "next";
import { InfoLink, InfoPage } from "@/components/info/InfoPage";
import { CONTACT } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  description: "Política de cambios, devoluciones, derecho de retracto y garantía de WOLFEX, de acuerdo con el Estatuto del Consumidor (Ley 1480 de 2011).",
  alternates: { canonical: "/devoluciones" },
};

export default function ReturnsPage() {
  return (
    <InfoPage
      current="/devoluciones"
      eyebrow="WOLFEX / Devoluciones"
      title="Cambios y devoluciones"
      intro="Queremos que compres tranquilo. Esta política sigue el Estatuto del Consumidor (Ley 1480 de 2011). Como son suplementos de consumo, por higiene y seguridad solo recibimos productos sellados."
      sections={[
        {
          title: "Derecho de retracto (5 días hábiles)",
          body: [
            "Por ser una compra a distancia, puedes retractarte dentro de los 5 días hábiles siguientes a la entrega (artículo 47 de la Ley 1480).",
            [
              "El producto debe estar sin abrir, con el sello de seguridad intacto y en su empaque original.",
              "Los costos de transporte de la devolución corren por tu cuenta.",
              "Te devolvemos el valor pagado dentro de los 30 días calendario siguientes al retracto.",
            ],
          ],
        },
        {
          title: "Producto equivocado, dañado o vencido",
          body: [
            "Si recibes un producto distinto al que pediste, con el empaque o el sello dañado, o con la fecha de vencimiento cumplida, escríbenos dentro de las 48 horas siguientes a la entrega con fotos del producto, el sello y el lote.",
            "En esos casos el cambio o la devolución no tiene ningún costo para ti.",
          ],
        },
        {
          title: "Cambios por sabor o presentación",
          body: [
            "Sí aceptamos cambios de sabor o presentación, siempre que el producto esté sellado, sin abrir y en su empaque original, y que lo solicites dentro de los 5 días hábiles siguientes a la entrega. En este caso, los costos de envío del cambio (ida y vuelta) los asume el cliente. El cambio está sujeto a disponibilidad del sabor o la presentación; si cuesta más, pagas la diferencia.",
          ],
        },
        {
          title: "Garantía",
          body: [
            "Todos los productos tienen la garantía legal: calidad, idoneidad y seguridad, y que sean originales. Si un producto sellado presenta un defecto de fabricación, lo cambiamos o te devolvemos el dinero.",
            "No aplica garantía por mal almacenamiento (humedad, calor) ni por productos abiertos que no presenten defecto.",
          ],
        },
        {
          title: "Reversión del pago",
          body: [
            "Si pagaste con un medio electrónico y fuiste víctima de fraude, la compra no fue solicitada, el producto no llegó o no corresponde a lo pedido, puedes pedir la reversión del pago dentro de los 5 días hábiles siguientes a conocer la situación (artículo 51 de la Ley 1480). Avísanos a nosotros y al emisor de tu medio de pago.",
          ],
        },
        {
          title: "Cómo solicitarlo",
          body: [
            [
              <>
                Escríbenos por WhatsApp al <InfoLink href={CONTACT.whatsapp.url}>{CONTACT.whatsapp.display}</InfoLink> o al correo{" "}
                <InfoLink href={`mailto:${CONTACT.email}`}>{CONTACT.email}</InfoLink> con tu número de pedido (empieza por WFX).
              </>,
              "Te respondemos por WhatsApp con los pasos a seguir y la dirección a la que debes enviar el producto.",
            ],
          ],
        },
      ]}
    />
  );
}
