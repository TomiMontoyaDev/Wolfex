import Link from "next/link";
import { PurchasePixel } from "@/components/analytics/PurchasePixel";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { db } from "@/server/db";
import { processMercadoPagoPayment } from "@/server/payments";

const COPY: Record<string, { title: string; message: string }> = {
  approved: {
    title: "Pago recibido",
    message: "Recibimos la respuesta de Mercado Pago. Tu pedido quedará confirmado en cuanto Mercado Pago nos notifique el pago.",
  },
  confirmed: {
    title: "Pedido confirmado",
    message: "Mercado Pago confirmó tu pago. Ya estamos preparando tu pedido.",
  },
  rejected: {
    title: "Pago rechazado",
    message: "Mercado Pago no aprobó el pago. Puedes intentarlo de nuevo con otro medio de pago.",
  },
  pending: {
    title: "Pago pendiente",
    message: "Tu pago está en proceso. Te avisaremos cuando Mercado Pago lo confirme.",
  },
};

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

async function findOrder(reference: string | undefined) {
  if (!reference || !/^[0-9a-f-]{36}$/i.test(reference)) return null;
  try {
    return await db.order.findUnique({
      where: { externalReference: reference },
      select: {
        orderNumber: true,
        externalReference: true,
        paymentStatus: true,
        total: true,
        review: { select: { id: true } },
        items: { select: { sku: true, quantity: true, unitPrice: true, productId: true, productName: true } },
      },
    });
  } catch {
    return null;
  }
}

/**
 * Respaldo del webhook: si Mercado Pago devuelve un payment_id, se verifica ESE pago contra la API de Mercado Pago
 * (monto, moneda y external_reference, igual que el webhook). La URL nunca se toma como prueba de pago: solo aporta
 * el id que se consulta. Cubre el desarrollo local (sin webhook) y avisos que lleguen tarde o fallen.
 */
async function verifyReturnedPayment(paymentId: string | undefined) {
  if (!paymentId || !/^\d{6,20}$/.test(paymentId)) return;
  try {
    // (La caché de la tienda la invalida el webhook; el checkout valida el stock real en la base igualmente.)
    await processMercadoPagoPayment(paymentId, "retorno");
  } catch (error) {
    // Si la verificación falla, el webhook sigue siendo la vía principal; la página solo informa.
    console.error("[payment/result] no se pudo verificar el pago", { paymentId, error });
  }
}

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  await verifyReturnedPayment(one(params.payment_id) ?? one(params.collection_id));

  const order = await findOrder(one(params.external_reference));
  const returned = String(params.collection_status ?? params.status ?? "pending");
  const key = order?.paymentStatus === "APPROVED" ? "confirmed" : order?.paymentStatus === "REJECTED" ? "rejected" : returned;
  const { title, message } = COPY[key] ?? COPY.pending;
  return <main className="container-wfx flex min-h-screen flex-col items-center justify-center text-center"><p className="type-label text-arc">WOLFEX · HUNT YOUR APEX</p><h1 className="mt-6 type-display text-[clamp(3rem,8vw,7rem)]">{title}</h1><p className="mt-6 max-w-lg text-steel">{message}</p>{order && <p className="mt-4 type-label text-steel/70">Pedido {order.orderNumber}</p>}{order && key === "confirmed" && <PurchasePixel orderNumber={order.orderNumber} orderRef={order.externalReference} value={order.total} contents={order.items.map((item) => ({ id: item.sku, quantity: item.quantity, item_price: item.unitPrice }))} />}{order && key === "confirmed" && !order.review && (
        <ReviewForm orderRef={order.externalReference} products={order.items.flatMap((item) => (item.productId ? [{ id: item.productId, name: item.productName }] : []))} />
      )}<Link href="/" className="mt-10 border border-arc px-6 py-4 type-label text-bone hover:bg-arc hover:text-void">Volver a WOLFEX</Link></main>;
}
