import Link from "next/link";

const COPY: Record<string, { title: string; message: string }> = {
  approved: {
    title: "Pago recibido",
    message: "Recibimos la respuesta de Mercado Pago. La orden quedará confirmada cuando validemos la notificación del servidor.",
  },
  rejected: {
    title: "Pago rechazado",
    message: "Mercado Pago no aprobó el pago. Puedes intentarlo de nuevo con otro medio de pago.",
  },
  pending: {
    title: "Pago pendiente",
    message: "Tu pago está en proceso. Te avisaremos cuando Mercado Pago lo confirme. La orden no se marcará como pagada solo por regresar a esta página.",
  },
};

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = String(params.collection_status ?? params.status ?? "pending");
  const { title, message } = COPY[status] ?? COPY.pending;
  const reference = typeof params.external_reference === "string" ? params.external_reference : undefined;
  return <main className="container-wfx flex min-h-screen flex-col items-center justify-center text-center"><p className="type-label text-arc">WOLFEX · HUNT YOUR APEX</p><h1 className="mt-6 type-display text-[clamp(3rem,8vw,7rem)]">{title}</h1><p className="mt-6 max-w-lg text-steel">{message}</p>{reference && <p className="mt-4 type-label text-steel/70">Orden {reference}</p>}<Link href="/" className="mt-10 border border-arc px-6 py-4 type-label text-bone hover:bg-arc hover:text-void">Volver a WOLFEX</Link></main>;
}
