import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_STATUS, PAYMENT_STATUS, formatDate, formatDateTime, money } from "@/components/admin/format";
import { Badge, DefinitionList, EmptyState, KpiCard, PageHeader, Panel, StatusBadge, Table, Td, Th, buttonClass, ghostButtonClass } from "@/components/admin/ui";
import { DangerAction } from "@/components/admin/DeleteControls";
import { deleteCustomersAction } from "@/server/admin/actions";
import { getCustomer } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Cliente" };

/** WhatsApp directo al cliente (número colombiano de 10 dígitos o con indicativo), con un saludo ya escrito. */
function customerWhatsapp(phone: string | null, firstName: string, products: string[]) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const number = digits.length === 10 ? `57${digits}` : digits.length >= 11 ? digits : null;
  if (!number) return null;
  const items = products.length ? ` con ${products.slice(0, 3).join(", ")}${products.length > 3 ? " y más" : ""}` : "";
  const message = `¡Hola ${firstName}! Te escribimos de WOLFEX. Vimos que dejaste tu pedido${items} a mitad de camino. ¿Te ayudamos a completarlo?`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default async function AdminCustomerDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const { id } = await params;
  const data = await getCustomer(id);
  if (!data) notFound();
  const { customer, stats, isLead, leadCart } = data;
  // El carrito solo importa si quedó sin comprar (posterior a su último pedido).
  const lastOrderAt = customer.orders[0]?.createdAt;
  const showCart = !!leadCart?.items.length && !!customer.leadUpdatedAt && (isLead || !lastOrderAt || customer.leadUpdatedAt > lastOrderAt);
  const chatUrl =customerWhatsapp(customer.phone, customer.firstName, leadCart?.items.map((item) => item.name) ?? []);

  return (
    <>
      <Link href="/admin/customers" className="type-label text-steel transition-colors hover:text-arc">← Clientes</Link>
      <div className="mt-4">
        <PageHeader
          eyebrow={`CLIENTE DESDE ${formatDate(customer.createdAt).toUpperCase()}`}
          title={customer.fullName}
          description={[customer.email, customer.phone].filter(Boolean).join(" · ") || undefined}
          actions={
            <>
              <Link href={`/admin/customers/${customer.id}/edit`} className={ghostButtonClass}>
                Editar cliente
              </Link>
              <Link href={`/admin/orders/new?cliente=${customer.id}`} className={buttonClass}>
                + Registrar venta
              </Link>
            </>
          }
        />
      </div>

      {(await searchParams).guardado === "1" && (
        <p role="status" className="mt-6 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Cliente guardado.
        </p>
      )}

      {showCart && leadCart && (
        <section className="mt-8 rounded-sm border border-amber-400/30 bg-amber-400/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {isLead && <Badge tone="warn">Posible cliente</Badge>}
                <h2 className="type-title text-lg">Carrito que dejó en el checkout</h2>
              </div>
              <p className="mt-1 text-sm text-steel">Última actividad: {formatDateTime(customer.leadUpdatedAt)}</p>
            </div>
            {chatUrl && (
              <a href={chatUrl} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                Escribir por WhatsApp
              </a>
            )}
          </div>
          <ul className="mt-4 divide-y divide-line text-sm">
            {leadCart.items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-4 py-2">
                <span>
                  {item.name} <span className="text-steel">× {item.quantity}</span>
                </span>
                <span className="font-mono">{money(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-line pt-3 type-title">
            <span>Total sin descuentos ni envío</span>
            <span className="font-mono text-arc">{money(leadCart.total)}</span>
          </p>
        </section>
      )}

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
