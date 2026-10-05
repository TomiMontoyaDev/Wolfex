import type { Metadata } from "next";
import Link from "next/link";
import { PrintToolbar } from "@/components/admin/PrintToolbar";
import { RECEIPT_PRINT_CSS, Receipt } from "@/components/admin/Receipt";
import { getReceiptOrders } from "@/server/admin/invoices";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Imprimir comprobantes" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Impresión en lote: /admin/facturas/imprimir?pedido=WFX-…&pedido=WFX-… (un comprobante por página). */
export default async function PrintManyReceiptsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const raw = (await searchParams).pedido;
  const numbers = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter((value) => /^WFX-[A-Z0-9-]{4,40}$/.test(value));
  const orders = await getReceiptOrders(numbers);

  if (!orders.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="type-title text-bone">No seleccionaste pedidos pagados para imprimir.</p>
        <Link href="/admin/facturas" className="type-label text-arc hover:underline">
          ← Volver a facturas
        </Link>
      </main>
    );
  }

  return (
    <>
      <style>{RECEIPT_PRINT_CSS}</style>
      <PrintToolbar count={orders.length} />
      {orders.map((order) => (
        <Receipt key={order.id} order={order} />
      ))}
    </>
  );
}
