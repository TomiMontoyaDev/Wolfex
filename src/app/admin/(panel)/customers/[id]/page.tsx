import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_STATUS, PAYMENT_STATUS, formatDate, formatDateTime, money } from "@/components/admin/format";
import { DefinitionList, EmptyState, KpiCard, PageHeader, Panel, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { DangerAction } from "@/components/admin/DeleteControls";
import { deleteCustomersAction } from "@/server/admin/actions";
import { getCustomer } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Cliente" };

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const data = await getCustomer(id);
  if (!data) notFound();
  const { customer, stats } = data;

  return (
    <>
      <Link href="/admin/customers" className="type-label text-steel transition-colors hover:text-arc">← Clientes</Link>
      <div className="mt-4">
        <PageHeader eyebrow={`CLIENTE DESDE ${formatDate(customer.createdAt).toUpperCase()}`} title={customer.fullName} description={customer.email} />
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard highlight label="Total gastado" value={money(stats.totalSpent)} hint={`${stats.paidOrders} pedidos pagados`} />
        <KpiCard label="Pedidos" value={stats.orders} hint="Incluye no pagados" />
        <KpiCard label="Ticket promedio" value={money(stats.avgTicket)} />
        <KpiCard label="Última compra" value={<span className="text-xl">{formatDate(stats.lastPurchase)}</span>} />
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="space-y-6">
          <Panel index="01" title="Datos">
            <DefinitionList
              items={[
                ["Nombre", customer.firstName],
                ["Apellidos", customer.lastName],
                ["Email", customer.email],
                ["Teléfono", customer.phone],
                ["Actualizado", formatDateTime(customer.updatedAt)],
              ]}
            />
          </Panel>
          <section className="rounded-sm border border-red-400/20 p-5">
            <p className="type-label text-red-300">Zona de peligro</p>
            <div className="mt-3">
              <DangerAction
                action={deleteCustomersAction}
                fields={{ ids: customer.id, redirectTo: "list" }}
                label="Eliminar cliente…"
                title={`¿Eliminar a ${customer.fullName}${stats.orders ? ` y sus ${stats.orders} ${stats.orders === 1 ? "pedido" : "pedidos"}` : ""}? No se puede deshacer.`}
                description={stats.paidOrders ? "Tiene pedidos pagados: también se borrarán del historial de ventas." : undefined}
                confirmLabel="Sí, eliminar cliente"
              />
            </div>
          </section>
          <Panel index="02" title={`Direcciones (${customer.addresses.length})`}>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-steel">Sin direcciones guardadas.</p>
            ) : (
              <ul className="space-y-4">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="border-l border-line-strong pl-4 text-sm">
                    <p>{[address.address, address.addressComplement].filter(Boolean).join(", ")}</p>
                    <p className="mt-1 text-steel">
                      {[address.neighborhood, address.city, address.department, address.country === "CO" ? "Colombia" : address.country].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 type-label text-steel/70">Usada desde {formatDate(address.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel index="03" title="Historial de pedidos">
          {customer.orders.length === 0 ? (
            <EmptyState title="Sin pedidos" />
          ) : (
            <Table minWidth={620}>
              <thead>
                <tr>
                  <Th>Pedido</Th>
                  <Th>Fecha</Th>
                  <Th>Pago</Th>
                  <Th>Estado</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-graphite/60">
                    <Td><Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-arc hover:underline">{order.orderNumber}</Link></Td>
                    <Td className="whitespace-nowrap text-steel">{formatDate(order.createdAt)}</Td>
                    <Td><StatusBadge map={PAYMENT_STATUS} value={order.paymentStatus} /></Td>
                    <Td><StatusBadge map={ORDER_STATUS} value={order.status} /></Td>
                    <Td align="right" className="font-mono">{money(order.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
