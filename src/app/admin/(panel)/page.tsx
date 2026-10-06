import Link from "next/link";
import { EVENT_LABEL, FULFILLMENT_STATUS, ORDER_STATUS, PAYMENT_STATUS, delta, formatDateTime, money } from "@/components/admin/format";
import { DeltaBadge, EmptyState, KpiCard, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { countPendingInvoices } from "@/server/admin/invoices";
import { getDashboardStats } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [s, pendingInvoices] = await Promise.all([getDashboardStats(), countPendingInvoices()]);

  return (
    <>
      <PageHeader
        eyebrow="WOLFEX® ADMIN / 00 — DASHBOARD"
        title="Control"
        description="Ventas = pedidos con pago aprobado (página web y ventas registradas a mano), según la fecha de pago (hora Colombia)."
        actions={
          <Link href="/admin/orders" className="border border-line-strong px-5 py-3 type-label transition-colors hover:border-arc hover:text-arc">
            Ver pedidos →
          </Link>
        }
      />

      {pendingInvoices > 0 && (
        <Link href="/admin/facturas" className="mt-6 flex items-center justify-between gap-4 rounded-sm border border-amber-400/40 bg-amber-400/10 px-5 py-4 text-amber-100 transition-colors hover:border-amber-300">
          <span className="type-title text-sm">
            {pendingInvoices === 1 ? "1 pedido pagado espera factura electrónica" : `${pendingInvoices} pedidos pagados esperan factura electrónica`}
          </span>
          <span className="type-label">Gestionar →</span>
        </Link>
      )}

      <section aria-label="Ventas" className="mt-8 grid gap-4 md:grid-cols-3">
        <KpiCard
          highlight
          label="Ventas este mes"
          value={money(s.month.revenue)}
          hint={`${s.month.orders} pedidos pagados`}
          footer={<DeltaBadge value={delta(s.month.revenue, s.prevMonth.revenue)} label="vs mismo corte mes anterior" />}
        />
        <KpiCard
          label="Últimos 7 días"
          value={money(s.week.revenue)}
          hint={`${s.week.orders} pedidos pagados`}
          footer={<DeltaBadge value={delta(s.week.revenue, s.prevWeek.revenue)} label="vs 7 días previos" />}
        />
        <KpiCard
          label="Ventas de hoy"
          value={money(s.today.revenue)}
          hint={`${s.today.orders} pedidos pagados`}
          footer={<DeltaBadge value={delta(s.today.revenue, s.yesterday.revenue)} label="vs ayer" />}
        />
      </section>

      <section aria-label="Indicadores" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ticket promedio (mes)"
          value={money(s.month.avgTicket)}
          footer={<DeltaBadge value={delta(s.month.avgTicket, s.prevMonth.avgTicket)} label="vs mes anterior" />}
        />
        <KpiCard label="Pedidos totales" value={s.totalOrders} hint={`${s.paid} con pago aprobado`} href="/admin/orders" />
        <KpiCard label="Pendientes de pago" value={s.pendingPayment} hint="Esperando confirmación de Mercado Pago" href="/admin/orders?view=to-pay" />
        <KpiCard highlight={s.toFulfil > 0} label="Por preparar" value={s.toFulfil} hint="Pagados, aún sin enviar" href="/admin/orders?view=to-ship" />
        <KpiCard label="Enviados" value={s.shipped} hint="En tránsito" href="/admin/orders?view=shipped" />
        <KpiCard label="Entregados" value={s.delivered} href="/admin/orders?view=delivered" />
        <KpiCard
          label="Clientes registrados"
          href="/admin/customers"
          value={s.customers}
          hint={`${s.newCustomers} nuevos este mes`}
          footer={<DeltaBadge value={delta(s.newCustomers, s.prevNewCustomers)} label="nuevos vs mes anterior" />}
        />
        <KpiCard
          label="Utilidad estimada (mes)"
          value={s.profit.hasAnyCost ? money(s.profit.profit) : "—"}
          hint={
            !s.profit.hasAnyCost
              ? "Registra costos en Productos para calcularla"
              : s.profit.complete
                ? "Con todos los costos conocidos"
                : `Parcial: ${s.profit.missingCostLines} líneas sin costo`
          }
        />
      </section>

      <Panel
        className="mt-8"
        index="PRIORIDAD"
        title={`Por despachar (${s.toFulfil})`}
        action={<Link href="/admin/orders?view=to-ship" className="type-label text-steel hover:text-arc">Ver todos →</Link>}
      >
        {s.toShip.length === 0 ? (
          <p className="text-sm text-steel">Todo al día: no hay pedidos pagados esperando envío.</p>
        ) : (
          <ul className="divide-y divide-line">
            {s.toShip.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 transition-colors hover:text-arc">
                  <span className="font-mono text-xs text-arc">{order.orderNumber}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {order.customerName}
                    {order.shippingCity && <span className="text-steel"> · {order.shippingCity}</span>}
                  </span>
                  <StatusBadge map={FULFILLMENT_STATUS} value={order.fulfillmentStatus} />
                  <span className="type-label text-steel">Pagado {formatDateTime(order.paidAt)}</span>
                  <span className="w-28 text-right font-mono text-sm">{money(order.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel index="01" title="Pedidos recientes" action={<Link href="/admin/orders" className="type-label text-steel hover:text-arc">Todos →</Link>}>
          {s.recentOrders.length === 0 ? (
            <EmptyState title="Todavía no hay pedidos" description="Cuando un cliente complete el checkout, aparecerá aquí." />
          ) : (
            <ul className="divide-y divide-line">
              {s.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 transition-colors hover:text-arc">
                    <span className="font-mono text-xs text-arc">{order.orderNumber}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{order.customerName}</span>
                    <StatusBadge map={PAYMENT_STATUS} value={order.paymentStatus} />
                    <StatusBadge map={ORDER_STATUS} value={order.status} />
                    <span className="w-28 text-right font-mono text-sm">{money(order.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel index="02" title="Actividad">
          {s.recentEvents.length === 0 ? (
            <p className="text-sm text-steel">Sin eventos todavía.</p>
          ) : (
            <ol className="space-y-4">
              {s.recentEvents.map((event) => (
                <li key={event.id} className="relative border-l border-line-strong pl-4">
                  <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-arc" aria-hidden="true" />
                  <p className="text-sm">{EVENT_LABEL[event.type]}</p>
                  <p className="mt-1 type-label text-steel">
                    <Link href={`/admin/orders/${event.order.id}`} className="text-arc hover:underline">
                      {event.order.orderNumber}
                    </Link>{" "}
                    · {formatDateTime(event.createdAt)} · {event.actor}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
