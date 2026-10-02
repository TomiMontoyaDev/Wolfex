import type { Metadata } from "next";
import Link from "next/link";
import { BarChart, type BarDatum } from "@/components/admin/BarChart";
import { delta, money, percent } from "@/components/admin/format";
import { DeltaBadge, EmptyState, KpiCard, PageHeader, Panel, Table, Td, Th } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { ANALYTICS_RANGES, getAnalytics } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Ventas" };

const RANGE_LABEL: Record<keyof typeof ANALYTICS_RANGES, string> = { "7d": "7 días", "30d": "30 días", "90d": "90 días", "365d": "12 meses" };

const dayFmt = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("es-CO", { month: "short", year: "2-digit", timeZone: "UTC" });

function toBars(rows: Array<{ key: string; revenue: number; orders: number }>, format: (date: Date) => string): BarDatum[] {
  return rows.map((row) => ({ key: row.key, label: format(new Date(`${row.key}T00:00:00Z`)), value: row.revenue, orders: row.orders }));
}

function SeriesTable({ data, period }: { data: BarDatum[]; period: string }) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer type-label text-steel/80 hover:text-arc">Ver como tabla</summary>
      <div className="mt-3">
        <Table minWidth={360}>
          <thead>
            <tr>
              <Th>{period}</Th>
              <Th align="right">Ventas</Th>
              <Th align="right">Pedidos</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.key}>
                <Td>{row.label}</Td>
                <Td align="right" className="font-mono">{money(row.value)}</Td>
                <Td align="right" className="font-mono">{row.orders}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </details>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const raw = await searchParams;
  const a = await getAnalytics(typeof raw.range === "string" ? raw.range : undefined);

  const daily = toBars(a.daily, (d) => dayFmt.format(d));
  const weekly = toBars(a.weekly, (d) => dayFmt.format(d));
  const monthly = toBars(a.monthly, (d) => monthFmt.format(d));
  const buyers = a.customers.newCustomers + a.customers.returning;
  const topMax = Math.max(...a.topProducts.map((p) => p.revenue), 1);

  return (
    <>
      <PageHeader
        eyebrow="WOLFEX® ADMIN / 03 — VENTAS"
        title="Analytics"
        description="Solo cuentan pedidos con pago aprobado. Los gráficos de tendencia muestran siempre los últimos 30 días, 12 semanas y 12 meses."
      />

      <nav aria-label="Período" className="mt-8 flex flex-wrap gap-1">
        {(Object.keys(ANALYTICS_RANGES) as Array<keyof typeof ANALYTICS_RANGES>).map((range) => (
          <Link
            key={range}
            href={`/admin/analytics?range=${range}`}
            aria-current={a.range === range ? "page" : undefined}
            className={cn(
              "border px-4 py-2.5 type-label transition-colors",
              a.range === range ? "border-volt bg-volt/15 text-bone" : "border-line-strong text-steel hover:border-arc hover:text-arc",
            )}
          >
            {RANGE_LABEL[range]}
          </Link>
        ))}
      </nav>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard highlight label={`Ventas · ${RANGE_LABEL[a.range]}`} value={money(a.summary.revenue)} footer={<DeltaBadge value={delta(a.summary.revenue, a.prevSummary.revenue)} />} />
        <KpiCard label="Pedidos pagados" value={a.summary.orders} footer={<DeltaBadge value={delta(a.summary.orders, a.prevSummary.orders)} />} />
        <KpiCard label="Ticket promedio" value={money(a.summary.avgTicket)} footer={<DeltaBadge value={delta(a.summary.avgTicket, a.prevSummary.avgTicket)} />} />
        <KpiCard
          label="Utilidad estimada"
          value={a.profit.hasAnyCost ? money(a.profit.profit) : "—"}
          hint={a.profit.hasAnyCost ? (a.profit.complete ? "Costos completos" : `Parcial · ${a.profit.missingCostLines} líneas sin costo`) : "Faltan costos de productos"}
        />
      </section>

      <div className="mt-6 grid gap-6">
        <Panel index="01" title="Ventas por día · últimos 30 días">
          <BarChart data={daily} title="Ventas por día, últimos 30 días" labelEvery={5} />
          <SeriesTable data={daily} period="Día" />
        </Panel>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel index="02" title="Ventas por semana · 12 semanas">
            <BarChart data={weekly} title="Ventas por semana, últimas 12 semanas" labelEvery={2} />
            <SeriesTable data={weekly} period="Semana del" />
          </Panel>
          <Panel index="03" title="Ventas por mes · 12 meses">
            <BarChart data={monthly} title="Ventas por mes, últimos 12 meses" labelEvery={2} />
            <SeriesTable data={monthly} period="Mes" />
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel index="04" title={`Productos más vendidos · ${RANGE_LABEL[a.range]}`}>
            {a.topProducts.length === 0 ? (
              <EmptyState title="Sin ventas en este período" />
            ) : (
              <ol className="space-y-4">
                {a.topProducts.map((product, index) => (
                  <li key={`${product.productId}-${product.sku}`}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="mr-3 font-mono text-xs text-steel">{String(index + 1).padStart(2, "0")}</span>
                        {product.name}
                      </span>
                      <span className="shrink-0 font-mono">{money(product.revenue)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-graphite">
                        <div className="h-full rounded-full bg-volt" style={{ width: `${(product.revenue / topMax) * 100}%` }} />
                      </div>
                      <span className="w-20 text-right type-label text-steel">{product.units} uds</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel index="05" title={`Clientes · ${RANGE_LABEL[a.range]}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-line-strong p-4">
                <p className="type-label text-steel">Nuevos</p>
                <p className="mt-3 font-mono text-3xl">{a.customers.newCustomers}</p>
                <p className="mt-2 type-label text-steel/80">Primera compra</p>
              </div>
              <div className="border border-line-strong p-4">
                <p className="type-label text-steel">Recurrentes</p>
                <p className="mt-3 font-mono text-3xl">{a.customers.returning}</p>
                <p className="mt-2 type-label text-steel/80">Ya habían comprado</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-steel">
              {buyers ? `${percent(a.customers.returning / buyers)} de los compradores del período son recurrentes.` : "Sin compradores en este período."}
            </p>
            {a.profit.hasAnyCost && (
              <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
                {[
                  ["Ingresos", money(a.profit.revenue)],
                  ["Costo de productos", `− ${money(a.profit.productCost)}`],
                  ["Comisión Mercado Pago", `− ${money(a.profit.fees)}`],
                  ["Costo de envíos", `− ${money(a.profit.shipping)}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-steel">
                    <dt>{label}</dt>
                    <dd className="font-mono">{value}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-line pt-2 type-title">
                  <dt>Utilidad estimada</dt>
                  <dd className="font-mono text-arc">{money(a.profit.profit)}</dd>
                </div>
              </dl>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
