import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SaleForm } from "@/components/admin/SaleForm";
import { PageHeader } from "@/components/admin/ui";
import { getSaleFormOptions, getSaleValues } from "@/server/admin/sale-data";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Editar venta" };

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [sale, options] = await Promise.all([getSaleValues(id), getSaleFormOptions()]);
  if (!sale) notFound();

  return (
    <>
      <Link href={`/admin/orders/${id}`} className="type-label text-steel transition-colors hover:text-arc">
        ← {sale.orderNumber}
      </Link>
      <div className="mt-4">
        <PageHeader
          eyebrow={`EDITAR VENTA · ${sale.webOrder ? "TIENDA WEB" : "REGISTRADA A MANO"}`}
          title={sale.orderNumber}
          description="Todo es modificable: cliente, productos, precios, costos, descuento, envío, comisión y gastos. El inventario se ajusta solo con la diferencia."
        />
      </div>
      <div className="mt-8">
        <SaleForm values={sale.values} products={options.products} customers={options.customers} webOrder={sale.webOrder} />
      </div>
    </>
  );
}
