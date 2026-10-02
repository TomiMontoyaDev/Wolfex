import Link from "next/link";
import { db } from "@/server/db";

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

async function findOrder(reference: string | undefined) {
  if (!reference || !/^[0-9a-f-]{36}$/i.test(reference)) return null;
  try {
    return await db.order.findUnique({ where: { externalReference: reference }, select: { orderNumber: true, paymentStatus: true } });
  } catch {
    return null;
  }
}

/** Solo informa: el estado real del pedido lo cambia únicamente el webhook validado. */
export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const reference = typeof params.external_reference === "string" ? params.external_reference : undefined;
  const order = await findOrder(reference);
  const returned = String(params.collection_status ?? params.status ?? "pending");
  const key = order?.paymentStatus === "APPROVED" ? "confirmed" : returned;
  const { title, message } = COPY[key] ?? COPY.pending;
  return <main className="container-wfx flex min-h-screen flex-col items-center justify-center text-center"><p className="type-label text-arc">WOLFEX · HUNT YOUR APEX</p><h1 className="mt-6 type-display text-[clamp(3rem,8vw,7rem)]">{title}</h1><p className="mt-6 max-w-lg text-steel">{message}</p>{order && <p className="mt-4 type-label text-steel/70">Pedido {order.orderNumber}</p>}<Link href="/" className="mt-10 border border-arc px-6 py-4 type-label text-bone hover:bg-arc hover:text-void">Volver a WOLFEX</Link></main>;
}
