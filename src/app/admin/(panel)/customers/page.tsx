import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, money } from "@/components/admin/format";
import { EmptyState, PageHeader, Pagination, Table, Td, Th, buildQuery, buttonClass, ghostButtonClass, inputClass } from "@/components/admin/ui";
import { BulkDelete, RowCheckbox, SelectAllCheckbox } from "@/components/admin/DeleteControls";
import { deleteCustomersAction } from "@/server/admin/actions";
import { listCustomers } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Clientes" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const BULK_FORM = "bulk-delete-customers";
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminCustomersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const raw = await searchParams;
  const q = one(raw.q);
  const { customers, total, page, pages } = await listCustomers({ q, page: one(raw.page) });

  return (
    <>
      <PageHeader
        eyebrow="WOLFEX® ADMIN / 02 — CLIENTES"
        title="Clientes"
        description={`${total} ${total === 1 ? "cliente" : "clientes"}. Los de la página se identifican por su correo; los creados a mano pueden no tenerlo.`}
        actions={
          <Link href="/admin/customers/new" className={buttonClass}>
            + Nuevo cliente
          </Link>
        }
      />

      {one(raw.eliminados) && (
        <p role="status" className="mt-6 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {one(raw.eliminados) === "1" ? "Cliente eliminado." : `${one(raw.eliminados)} clientes eliminados.`}
        </p>
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
          <>
          <div className="mb-3">
            <BulkDelete
              action={deleteCustomersAction}
              formId={BULK_FORM}
              singular="cliente seleccionado"
              plural="clientes seleccionados"
              warning="Se borran de la base junto con todos sus pedidos, pagos y direcciones. No se puede deshacer."
            />
          </div>
          <Table minWidth={940}>
            <thead>
              <tr>
                <Th className="w-10"><SelectAllCheckbox formId={BULK_FORM} label="Seleccionar todos los clientes de esta página" /></Th>
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
                  <Td><RowCheckbox formId={BULK_FORM} id={customer.id} label={`Seleccionar a ${customer.fullName}`} /></Td>
                  <Td>
                    <Link href={`/admin/customers/${customer.id}`} className="hover:text-arc">{customer.fullName}</Link>
                  </Td>
                  <Td className="text-steel">{customer.email ?? "—"}</Td>
                  <Td className="text-steel">{customer.phone ?? "—"}</Td>
                  <Td align="right" className="font-mono">{customer.orders}</Td>
                  <Td align="right" className="font-mono">{money(customer.totalSpent)}</Td>
                  <Td className="whitespace-nowrap text-steel">{formatDate(customer.lastOrderAt)}</Td>
                  <Td className="whitespace-nowrap text-steel">{formatDate(customer.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          </>
        )}
        <Pagination page={page} pages={pages} href={(p) => buildQuery("/admin/customers", { q, page: p })} />
      </div>
    </>
  );
}
