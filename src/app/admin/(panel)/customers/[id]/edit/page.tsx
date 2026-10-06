import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/admin/CustomerForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id }, include: { addresses: { orderBy: { updatedAt: "desc" }, take: 1 } } });
  if (!customer) notFound();
  const address = customer.addresses[0];

  return (
    <>
      <Link href={`/admin/customers/${id}`} className="type-label text-steel transition-colors hover:text-arc">
        ← {customer.fullName}
      </Link>
      <div className="mt-4">
        <PageHeader eyebrow="WOLFEX® ADMIN / 02 — CLIENTES" title="Editar cliente" description="Cambia el perfil del cliente. Las ventas ya registradas conservan los datos con que se hicieron (puedes editarlos en cada venta)." />
      </div>
      <div className="mt-8">
        <CustomerForm
          values={{
            id: customer.id,
            fullName: customer.fullName,
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            department: address?.department ?? "",
            city: address?.city ?? "",
            address: address?.address ?? "",
            addressComplement: address?.addressComplement ?? "",
          }}
        />
      </div>
    </>
  );
}
