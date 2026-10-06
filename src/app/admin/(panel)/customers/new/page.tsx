import type { Metadata } from "next";
import Link from "next/link";
import { CustomerForm } from "@/components/admin/CustomerForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default async function NewCustomerPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/customers" className="type-label text-steel transition-colors hover:text-arc">
        ← Clientes
      </Link>
      <div className="mt-4">
        <PageHeader eyebrow="WOLFEX® ADMIN / 02 — CLIENTES" title="Nuevo cliente" description="Para clientes de WhatsApp, Instagram o la tienda física. El correo es opcional." />
      </div>
      <div className="mt-8">
        <CustomerForm values={{ fullName: "", email: "", phone: "", department: "Risaralda", city: "Pereira", address: "", addressComplement: "" }} />
      </div>
    </>
  );
}
