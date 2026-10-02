import type { Metadata } from "next";
import Link from "next/link";
import { ORDER_STATUS, PAYMENT_STATUS, formatDateTime, money, paymentMethodLabel } from "@/components/admin/format";
import { EmptyState, PageHeader, Pagination, StatusBadge, Table, Td, Th, buildQuery, ghostButtonClass, inputClass } from "@/components/admin/ui";
import { listOrders, type OrderFilters } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Pedidos" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const raw = await searchParams;
  const filters: OrderFilters = {
    q: one(raw.q),
    status: one(raw.status),
    payment: one(raw.payment),
    from: one(raw.from),
    to: one(raw.to),
    sort: one(raw.sort),
    page: one(raw.page),
  };
  const { orders, total, page, pages } = await listOrders(filters);
  const hasFilters = Boolean(filters.q || filters.status || filters.payment || filters.from || filters.to);
  const select = `${inputClass} appearance-none`;

  return (
    <>
      <PageHeader eyebrow="WOLFEX® ADMIN / 01 — PEDIDOS" title="Pedidos" description={`${total} ${total === 1 ? "pedido" : "pedidos"}${hasFilters ? " con los filtros actuales" : ""}.`} />

      <form className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))_auto]" role="search">
        <label className="block">
          <span className="sr-only">Buscar</span>
          <input name="q" defaultValue={filters.q} placeholder="Nº de pedido, nombre o email" className={inputClass} />
        </label>
        <label className="block">
          <span className="sr-only">Estado del pago</span>
          <select name="payment" defaultValue={filters.payment ?? ""} className={select}>
            <option value="">Pago: todos</option>
            {Object.entries(PAYMENT_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Estado del pedido</span>
          <select name="status" defaultValue={filters.status ?? ""} className={select}>
            <option value="">Pedido: todos</option>
            {Object.entries(ORDER_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Desde</span>
          <input type="date" name="from" defaultValue={filters.from} className={inputClass} aria-label="Desde" />
        </label>
        <label className="block">
          <span className="sr-only">Hasta</span>
          <input type="date" name="to" defaultValue={filters.to} className={inputClass} aria-label="Hasta" />
        </label>
        <label className="block">
          <span className="sr-only">Orden</span>
          <select name="sort" defaultValue={filters.sort ?? "desc"} className={select}>
            <option value="desc">Más recientes</option>
            <option value="asc">Más antiguos</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button className={ghostButtonClass}>Filtrar</button>
          {hasFilters && (
            <Link href="/admin/orders" className="inline-flex h-11 items-center px-2 type-label text-steel hover:text-arc">
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <div className="mt-6">
        {orders.length === 0 ? (
          <EmptyState
            title={hasFilters ? "Ningún pedido coincide" : "Todavía no hay pedidos"}
            description={hasFilters ? "Prueba con otros filtros o limpia la búsqueda." : "Los pedidos aparecen aquí en cuanto un cliente completa el checkout."}
          />
        ) : (
          <Table minWidth={1100}>
            <thead>
              <tr>
                <Th>Pedido</Th>
                <Th>Fecha</Th>
                <Th>Cliente</Th>
                <Th>Email</Th>
                <Th align="right">Total</Th>
                <Th>Pago</Th>
                <Th>Pedido</Th>
                <Th>Método</Th>
                <Th>Ciudad</Th>
                <Th align="right"><span className="sr-only">Acciones</span></Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-graphite/60">
                  <Td><Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-arc hover:underline">{order.orderNumber}</Link></Td>
                  <Td className="whitespace-nowrap text-steel">{formatDateTime(order.createdAt)}</Td>
                  <Td className="max-w-48 truncate">{order.customerName}</Td>
                  <Td className="max-w-56 truncate text-steel">{order.customerEmail}</Td>
                  <Td align="right" className="font-mono">{money(order.total)}</Td>
                  <Td><StatusBadge map={PAYMENT_STATUS} value={order.paymentStatus} /></Td>
                  <Td><StatusBadge map={ORDER_STATUS} value={order.status} /></Td>
                  <Td className="text-steel">{paymentMethodLabel(order.paymentMethod)}</Td>
                  <Td className="text-steel">{order.shippingCity ?? "—"}</Td>
                  <Td align="right"><Link href={`/admin/orders/${order.id}`} className="type-label text-steel hover:text-arc">Ver →</Link></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} pages={pages} href={(p) => buildQuery("/admin/orders", { ...filters, page: p })} />
      </div>
    </>
  );
}
