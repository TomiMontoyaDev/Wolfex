import Link from "next/link";

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const state = String(params.x_transaction_state ?? params.state ?? "Pendiente");
  const title = state === "Aceptada" ? "Pago recibido" : state === "Rechazada" ? "Pago rechazado" : "Pago pendiente";
  const message = state === "Aceptada" ? "Recibimos la respuesta de ePayco. La orden quedará confirmada cuando validemos la notificación del servidor." : "Puedes revisar el estado con tu comprobante de ePayco. La orden no se marcará como pagada solo por regresar a esta página.";
  return <main className="container-wfx flex min-h-screen flex-col items-center justify-center text-center"><p className="type-label text-arc">WOLFEX · HUNT YOUR APEX</p><h1 className="mt-6 type-display text-[clamp(3rem,8vw,7rem)]">{title}</h1><p className="mt-6 max-w-lg text-steel">{message}</p><Link href="/" className="mt-10 border border-arc px-6 py-4 type-label text-bone hover:bg-arc hover:text-void">Volver a WOLFEX</Link></main>;
}
