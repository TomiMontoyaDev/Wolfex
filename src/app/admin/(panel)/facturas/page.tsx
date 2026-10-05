import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime, money } from "@/components/admin/format";
import { CopyInvoiceData, MarkIssuedForm } from "@/components/admin/InvoiceActions";
import { Badge, EmptyState, PageHeader, ghostButtonClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { INVOICE_FILTERS, billingParty, invoiceCopyText, listInvoiceOrders, type InvoiceFilter } from "@/server/admin/invoices";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Facturas" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const PRINT_FORM = "print-receipts";

const STATUS = {
  NO_SOLICITADA: { label: "No solicitada", tone: "muted" },
  PENDIENTE: { label: "Pendiente", tone: "warn" },
  EMITIDA: { label: "Emitida", tone: "good" },
} as const;

export default async function AdminInvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const raw = await searchParams;
  const filter: InvoiceFilter = typeof raw.filtro === "string" && raw.filtro in INVOICE_FILTERS ? (raw.filtro as InvoiceFilter) : "pendientes";
  const { orders, counts } = await listInvoiceOrders(filter);

  return (
    <>
      <PageHeader
        eyebrow="WOLFEX® ADMIN / 06 — FACTURAS"
        title="Facturas"
        description="Solicitudes de factura electrónica de pedidos pagados. Expide la factura en tu software autorizado por la DIAN y regístrala aquí con su número y CUFE."
      />

      {typeof raw.registrada === "string" && (
        <p role="status" className="mt-6 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Factura registrada para el pedido {raw.registrada}. Ya figura como emitida.
        </p>
      )}

      {counts.pendientes > 0 && filter !== "pendientes" && (
        <Link href="/admin/facturas" className="mt-6 block rounded-sm border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 hover:border-amber-300">
          {counts.pendientes === 1 ? "Hay 1 pedido esperando factura electrónica." : `Hay ${counts.pendientes} pedidos esperando factura electrónica.`} Ver pendientes →
        </Link>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2" aria-label="Filtrar facturas">
          {(Object.keys(INVOICE_FILTERS) as InvoiceFilter[]).map((key) => (
            <Link
              key={key}
              href={`/admin/facturas?filtro=${key}`}
              aria-current={key === filter ? "page" : undefined}
              className={cn("border px-4 py-2 type-label transition-colors", key === filter ? "border-arc bg-arc/10 text-bone" : "border-line-strong text-steel hover:text-bone")}
            >
              {INVOICE_FILTERS[key].label} <span className={cn("ml-1 font-mono", key === "pendientes" && counts.pendientes ? "text-amber-300" : "text-arc")}>{counts[key]}</span>
            </Link>
          ))}
        </nav>
        {orders.length > 0 && (
          // Formulario GET: los checkboxes de cada pedido se asocian con form={PRINT_FORM}.
          <form id={PRINT_FORM} action="/admin/facturas/imprimir" method="get" target="_blank">
            <button className={ghostButtonClass}>Imprimir varios</button>
          </form>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <EmptyState
            title={filter === "pendientes" ? "No hay facturas pendientes" : filter === "emitidas" ? "Todavía no hay facturas emitidas" : "Todavía no hay pedidos pagados"}
            description={filter === "pendientes" ? "Cuando un cliente pida factura electrónica y pague, su pedido aparecerá aquí." : undefined}
          />
        ) : (
          orders.map((order) => {
            const party = billingParty(order);
            const status = STATUS[order.invoiceStatus];
            return (
              <article key={order.id} className={cn("rounded-sm border bg-ink/80 p-5", order.invoiceStatus === "PENDIENTE" ? "border-amber-400/40" : "border-line-strong")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" name="pedido" value={order.orderNumber} form={PRINT_FORM} className="mt-1 h-4 w-4 accent-[#0066ff]" aria-label={`Seleccionar ${order.orderNumber} para imprimir`} />
                    <span>
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm text-arc hover:underline">
                        {order.orderNumber}
                      </Link>
                      <span className="mt-1 block text-xs text-steel">
                        Pagado {formatDateTime(order.paidAt ?? order.createdAt)}
                        {order.receiptNumber && ` · Comprobante ${order.receiptNumber}`}
                      </span>
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg text-bone">{money(order.total)}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div>
                    <p className="type-label text-steel">{order.invoiceRequest ? "Datos de facturación" : "Cliente (no pidió factura: datos de envío)"}</p>
                    <dl className="mt-2 space-y-1 text-sm">
                      <Row label="Nombre">{party.name}</Row>
                      {party.personType && <Row label="Tipo">{party.personType}</Row>}
                      {party.document && <Row label="Documento">{party.document}</Row>}
                      <Row label="Correo">{party.email}</Row>
                      <Row label="Teléfono">{party.phone ?? "—"}</Row>
                      <Row label="Dirección">{party.address}</Row>
                    </dl>
                  </div>
                  <div>
                    <p className="type-label text-steel">Productos</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-4">
                          <span className="text-bone/90">
                            {item.quantity} × {item.productName}
                            {item.variant && <span className="text-steel"> · {item.variant}</span>}
                          </span>
                          <span className="shrink-0 font-mono text-steel">{money(item.totalPrice)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {order.invoiceStatus === "EMITIDA" && (
                  <p className="mt-4 break-all rounded-sm border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">
                    Factura electrónica No. {order.dianInvoiceNumber} · CUFE: {order.cufe} · {formatDateTime(order.invoiceIssuedAt)}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-start gap-2 border-t border-line pt-4">
                  {order.requiresInvoice && (
                    <MarkIssuedForm orderId={order.id} issued={order.invoiceStatus === "EMITIDA"} defaultNumber={order.dianInvoiceNumber} defaultCufe={order.cufe} />
                  )}
                  <CopyInvoiceData text={invoiceCopyText(order)} />
                  <a href={`/admin/facturas/${order.orderNumber}/imprimir`} target="_blank" rel="noreferrer" className={ghostButtonClass}>
                    Imprimir comprobante
                  </a>
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
      <dt className="text-steel">{label}</dt>
      <dd className="break-words text-bone/90">{children}</dd>
    </div>
  );
}
