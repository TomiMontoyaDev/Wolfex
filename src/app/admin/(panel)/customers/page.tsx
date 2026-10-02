import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, money } from "@/components/admin/format";
import { EmptyState, PageHeader, Pagination, Table, Td, Th, buildQuery, ghostButtonClass, inputClass } from "@/components/admin/ui";
import { listCustomers } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Clientes" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminCustomersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const raw = await searchParams;
  const q = one(raw.q);
  const { customers, total, page, pages } = await listCustomers({ q, page: one(raw.page) });

  return (
    <>
      <PageHeader eyebrow="WOLFEX® ADMIN / 02 — CLIENTES" title="Clientes" description={`${total} ${total === 1 ? "cliente" : "clientes"}. Un cliente se identifica por su email.`} />

      {one(raw.eliminado) && (
        <p role="status" className="mt-6 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Cliente eliminado.</p>
      )}

      <form className="mt-8 flex max-w-xl gap-2" role="search">
        <label className="block flex-1">
          <span className="sr-only">Buscar cliente</span>
          <input name="q" defaultValue={q} placeholder="Nombre, email o teléfono" className={inputClass} />
        </label>
        <button className={ghostButtonClass}>Buscar</button>
      </form>

      <div className="mt-6">
        {customers.length === 0 ? (
          <EmptyState title={q ? "Ningún cliente coincide" : "Todavía no hay clientes"} description={q ? "Prueba con otra búsqueda." : "Los clientes se crean automáticamente con su primer pedido."} />
        ) : (
          <Table minWidth={900}>
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Teléfono</Th>
                <Th align="right">Pedidos</Th>
                <Th align="right">Total gastado</Th>
                <Th>Último pedido</Th>
                <Th>Registro</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="transition-colors hover:bg-graphite/60">
                  <Td>
                    <Link href={`/admin/customers/${customer.id}`} className="hover:text-arc">{customer.fullName}</Link>
                  </Td>
                  <Td className="text-steel">{customer.email}</Td>
                  <Td className="text-steel">{customer.phone ?? "—"}</Td>
                  <Td align="right" className="font-mono">{customer.orders}</Td>
                  <Td align="right" className="font-mono">{money(customer.totalSpent)}</Td>
                  <Td className="whitespace-nowrap text-steel">{formatDate(customer.lastOrderAt)}</Td>
                  <Td className="whitespace-nowrap text-steel">{formatDate(customer.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} pages={pages} href={(p) => buildQuery("/admin/customers", { q, page: p })} />
      </div>
    </>
  );
}
