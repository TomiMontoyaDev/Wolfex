import type { Metadata } from "next";
import Link from "next/link";
import { SaleForm } from "@/components/admin/SaleForm";
import { PageHeader } from "@/components/admin/ui";
import { emptySaleValues, getSaleFormOptions } from "@/server/admin/sale-data";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Registrar venta" };

export default async function NewSalePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const { cliente } = await searchParams;
  const { products, customers } = await getSaleFormOptions();
  const values = emptySaleValues();
  // Desde la página de un cliente: la venta arranca con ese cliente elegido.
  const preset = typeof cliente === "string" ? customers.find((customer) => customer.id === cliente) : undefined;
  if (preset) {
    values.customerId = preset.id;
    values.customer = { fullName: preset.fullName, phone: preset.phone ?? "", email: preset.email ?? "", department: preset.department ?? "", city: preset.city ?? "", address: preset.address ?? "" };
  }

  return (
    <>
      <Link href="/admin/orders" className="type-label text-steel transition-colors hover:text-arc">
        ← Pedidos
      </Link>
      <div className="mt-4">
        <PageHeader
          eyebrow="WOLFEX® ADMIN / 01 — PEDIDOS"
          title="Registrar venta"
          description="Ventas por WhatsApp, transferencia, efectivo o en persona. Cuenta en las ventas y en la utilidad del panel igual que las de la página."
        />
      </div>
      <div className="mt-8">
        <SaleForm values={values} products={products} customers={customers} />
      </div>
    </>
  );
}
