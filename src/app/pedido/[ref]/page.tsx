import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MapPin, MessageCircle } from "lucide-react";
import { CopyButton } from "@/components/checkout/CopyButton";
import { TRANSFER_DETAILS, PICKUP_CITY } from "@/config/payments";
import { WHATSAPP_ASESORIA, WHATSAPP_PAGOS, whatsappLink } from "@/lib/site-config";
import { formatPrice } from "@/lib/utils";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };

const REF = /^[0-9a-f-]{36}$/i;

/**
 * Confirmación del pedido (transferencia o recoger). Se abre con la referencia privada del pedido
 * (UUID), no con el número: nadie puede ver pedidos ajenos adivinando números.
 */
export default async function OrderPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  if (!REF.test(ref)) notFound();
  const order = await db.order.findUnique({
    where: { externalReference: ref },
    select: {
      orderNumber: true,
      total: true,
      subtotal: true,
      discount: true,
      shippingCost: true,
      paymentProvider: true,
      paymentStatus: true,
      customerName: true,
      customerPhone: true,
      shippingCity: true,
      shippingDepartment: true,
      items: { select: { productName: true, quantity: true, totalPrice: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const paid = order.paymentStatus === "APPROVED";
  const transfer = order.paymentProvider === "TRANSFER";
  const pickup = order.paymentProvider === "PICKUP";
  const products = order.items.map((item) => `• ${item.quantity} x ${item.productName}`);
  const city = [order.shippingCity, order.shippingDepartment].filter(Boolean).join(", ");

  const receiptMessage = [
    `Hola WOLFEX, envío el comprobante del pedido ${order.orderNumber}.`,
    "Productos:",
    ...products,
    `Total: ${formatPrice(order.total)}`,
    `Nombre: ${order.customerName}`,
    `Ciudad: ${city}`,
    `Teléfono: ${order.customerPhone ?? "-"}`,
    "Adjunto mi comprobante de pago.",
  ].join("\n");
  const pickupMessage = [
    `Hola WOLFEX, quiero coordinar la recogida del pedido ${order.orderNumber} en ${PICKUP_CITY}.`,
    "Productos:",
    ...products,
    `Total a pagar: ${formatPrice(order.total)}`,
    `Nombre: ${order.customerName}`,
    `Teléfono: ${order.customerPhone ?? "-"}`,
  ].join("\n");

  return (
    <main className="container-wfx min-h-screen pb-24 pt-[calc(var(--nav-h)+2.5rem)]">
      <div className="mx-auto max-w-xl">
        <p className="flex items-center gap-2 type-label text-arc">
          {paid ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          {paid ? "Pago recibido" : "Pedido creado · pendiente de pago"}
        </p>
        <h1 className="mt-3 type-title text-[clamp(1.6rem,6vw,2.4rem)] leading-tight text-bone">
          {paid ? "¡Gracias por tu compra!" : transfer ? "Último paso: haz la transferencia" : pickup ? "Te esperamos en Pereira" : "Tu pedido"}
        </h1>

        <div className="mt-6 flex items-end justify-between gap-4 border border-line-strong bg-ink/70 p-4">
          <div>
            <p className="type-label text-steel">Pedido</p>
            <p className="mt-1 font-mono text-sm text-bone">{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="type-label text-steel">{paid ? "Total pagado" : "Total a pagar"}</p>
            <p className="mt-1 font-mono text-3xl text-arc">{formatPrice(order.total)}</p>
          </div>
        </div>

        {transfer && !paid && (
          <section className="mt-6 border border-arc/40 bg-arc/5 p-4" aria-labelledby="pay-title">
            <h2 id="pay-title" className="type-title text-base text-bone">Datos para pagar</h2>
            <p className="mt-1 text-xs text-steel">Transfiere exactamente {formatPrice(order.total)} por Bancolombia, Nequi o Bre-B.</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                <div className="min-w-0">
                  <dt className="type-label text-steel">{TRANSFER_DETAILS.bank} · {TRANSFER_DETAILS.accountType}</dt>
                  <dd className="mt-1 font-mono text-base text-bone">{TRANSFER_DETAILS.accountNumber}</dd>
                </div>
                <CopyButton value={TRANSFER_DETAILS.accountNumber} label="número de cuenta" digitsOnly />
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                <div className="min-w-0">
                  <dt className="type-label text-steel">Llave (Bre-B)</dt>
                  <dd className="mt-1 font-mono text-base text-bone">{TRANSFER_DETAILS.key}</dd>
                </div>
                <CopyButton value={TRANSFER_DETAILS.key} label="llave" />
              </div>
              <div>
                <dt className="type-label text-steel">Titular</dt>
                <dd className="mt-1 font-mono text-bone">{TRANSFER_DETAILS.holderMasked}</dd>
              </div>
            </dl>
            <a
              href={whatsappLink(receiptMessage, WHATSAPP_PAGOS)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 bg-[#25D366] type-title text-sm text-[#062b14]"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2} /> Enviar comprobante por WhatsApp
            </a>
            <p className="mt-3 text-xs text-steel">Apenas confirmemos tu pago, preparamos el envío y te avisamos por WhatsApp.</p>
          </section>
        )}

        {pickup && !paid && (
          <section className="mt-6 border border-arc/40 bg-arc/5 p-4" aria-labelledby="pickup-title">
            <h2 id="pickup-title" className="flex items-center gap-2 type-title text-base text-bone">
              <MapPin className="h-4 w-4 text-arc" /> Recoges y pagas en {PICKUP_CITY}
            </h2>
            <p className="mt-2 text-sm text-bone/85">Escríbenos para acordar la hora y el lugar. Pagas al recoger.</p>
            <a
              href={whatsappLink(pickupMessage, WHATSAPP_ASESORIA)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 bg-[#25D366] type-title text-sm text-[#062b14]"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2} /> Coordinar por WhatsApp
            </a>
          </section>
        )}

        <section className="mt-6" aria-labelledby="items-title">
          <h2 id="items-title" className="type-label text-steel">Tu pedido</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between gap-3 py-2.5">
                <span className="text-bone/90">{item.quantity} x {item.productName}</span>
                <span className="shrink-0 font-mono">{formatPrice(item.totalPrice)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 text-sm text-steel">
            {order.discount > 0 && <div className="flex justify-between text-arc"><dt>Descuento combo</dt><dd className="font-mono">− {formatPrice(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Envío</dt><dd className="font-mono">{pickup ? "Recoges en tienda" : order.shippingCost ? formatPrice(order.shippingCost) : "GRATIS"}</dd></div>
            <div className="flex justify-between type-title text-base text-bone"><dt>Total</dt><dd className="font-mono">{formatPrice(order.total)}</dd></div>
          </dl>
        </section>
      </div>
    </main>
  );
}
