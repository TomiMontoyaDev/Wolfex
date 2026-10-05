import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/admin/PrintToolbar";
import { RECEIPT_PRINT_CSS, Receipt } from "@/components/admin/Receipt";
import { getReceiptOrders } from "@/server/admin/invoices";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Comprobante de venta" };

// Fuera del grupo (panel) para imprimir sin la barra lateral; por eso valida la sesión aquí.
export default async function PrintReceiptPage({ params }: { params: Promise<{ pedido: string }> }) {
  await requireAdmin();
  const { pedido } = await params;
  const [order] = await getReceiptOrders([decodeURIComponent(pedido)]);
  if (!order) notFound();

  return (
    <>
      <style>{RECEIPT_PRINT_CSS}</style>
      <PrintToolbar count={1} />
      <Receipt order={order} />
    </>
  );
}
