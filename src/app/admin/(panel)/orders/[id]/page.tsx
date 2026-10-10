import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENT_LABEL, FULFILLMENT_STATUS, ORDER_STATUS, PAYMENT_STATUS, formatDateTime, money, paymentMethodLabel } from "@/components/admin/format";
import { DangerAction } from "@/components/admin/DeleteControls";
import { OrderStatusActions, ShippingForm } from "@/components/admin/OrderActions";
import { deleteOrdersAction } from "@/server/admin/actions";
import { DefinitionList, PageHeader, Panel, StatusBadge, Table, Td, Th, buttonClass } from "@/components/admin/ui";
import { salesChannelLabel } from "@/config/sales";
import { getOrder } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Pedido" };

/** Cómo se paga el pedido. */
const PROVIDER_LABEL: Record<string, string> = {
  MERCADOPAGO: "Mercado Pago",
  MANUAL: "Registrada a mano",
  TRANSFER: "Transferencia o llave",
  PICKUP: "Recoge y paga en Pereira",
};

export default async function AdminOrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const approvedPayment = order.payments.find((payment) => payment.providerPaymentId === order.paymentId) ?? order.payments[0];
  const fullAddress = [order.shippingAddress, order.shippingComplement, order.shippingNeighborhood].filter(Boolean).join(", ");
  const manual = order.paymentProvider === "MANUAL";
  const saved = (await searchParams).guardada === "1";

  // Utilidad neta de esta venta (solo con los costos conocidos).
  const productCost = order.items.reduce((sum, item) => sum + (item.unitCost ?? 0) * item.quantity, 0);
  const missingCost = order.items.filter((item) => item.unitCost === null).length;
  const expensesTotal = order.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profit = order.total - productCost - (order.paymentFee ?? 0) - (order.shippingCostActual ?? 0) - expensesTotal;

  return (
    <>
      <Link href="/admin/orders" className="type-label text-steel transition-colors hover:text-arc">← Pedidos</Link>
      <div className="mt-4">
        <PageHeader
          eyebrow={`${manual ? "VENTA MANUAL" : "PEDIDO WEB"} · ${salesChannelLabel(order.salesChannel).toUpperCase()} · ${formatDateTime(order.createdAt)}`}
          title={order.orderNumber}
          actions={
            <>
              <StatusBadge map={PAYMENT_STATUS} value={order.paymentStatus} />
              <StatusBadge map={ORDER_STATUS} value={order.status} />
              <StatusBadge map={FULFILLMENT_STATUS} value={order.fulfillmentStatus} />
              <Link href={`/admin/orders/${order.id}/edit`} className={buttonClass}>
                Editar venta
              </Link>
            </>
          }
        />
      </div>

      {saved && (
        <p role="status" className="mt-6 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Venta guardada.
        </p>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel index="01" title="Productos">
            <Table minWidth={560}>
              <thead>
                <tr>
                  <Th>Producto</Th>
                  <Th>SKU</Th>
                  <Th align="right">Cant.</Th>
                  <Th align="right">Precio unit.</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td>
                      <p>{item.productName}</p>
                      {item.variant && <p className="mt-1 type-label text-steel">{item.variant}</p>}
                    </Td>
                    <Td className="font-mono text-xs text-steel">{item.sku}</Td>
                    <Td align="right" className="font-mono">{item.quantity}</Td>
                    <Td align="right" className="font-mono">{money(item.unitPrice)}</Td>
                    <Td align="right" className="font-mono">{money(item.totalPrice)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <dl className="ml-auto mt-6 max-w-sm space-y-2.5 text-sm">
              {[
                ["Subtotal", money(order.subtotal)],
                [manual ? "Descuento" : "Descuento combo", order.discount ? `− ${money(order.discount)}` : money(0)],
                ["Envío", order.paymentProvider === "PICKUP" ? "Recoge en Pereira" : order.shippingCost ? money(order.shippingCost) : "Gratis"],
                ["Impuestos", order.tax ? money(order.tax) : "Incluidos"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-steel">
                  <dt>{label}</dt>
                  <dd className="font-mono">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-line pt-3 type-title text-lg">
                <dt>Total</dt>
                <dd className="font-mono text-arc">{money(order.total)}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
              <p className={order.invoiceStatus === "PENDIENTE" ? "text-amber-200" : "text-steel"}>
                Factura electrónica:{" "}
                {order.invoiceStatus === "EMITIDA" ? `emitida (No. ${order.dianInvoiceNumber})` : order.invoiceStatus === "PENDIENTE" ? "solicitada, pendiente" : "no solicitada"}
              </p>
              {order.paymentStatus === "APPROVED" && (
                <div className="flex gap-4 type-label">
                  {order.requiresInvoice && (
                    <Link href={`/admin/facturas?filtro=${order.invoiceStatus === "EMITIDA" ? "emitidas" : "pendientes"}`} className="text-arc hover:underline">
                      Gestionar factura →
                    </Link>
                  )}
                  <a href={`/admin/facturas/${order.orderNumber}/imprimir`} target="_blank" rel="noreferrer" className="text-arc hover:underline">
                    Imprimir comprobante
                  </a>
                </div>
              )}
            </div>
          </Panel>

          <Panel index="02" title="Utilidad neta" action={<Link href={`/admin/orders/${order.id}/edit`} className="type-label text-steel hover:text-arc">Editar costos →</Link>}>
            <dl className="max-w-md space-y-2.5 text-sm">
              {[
                ["Total de la venta", money(order.total)],
                ["Costo de productos", `− ${money(productCost)}`],
                ["Comisión del medio de pago", order.paymentFee === null ? "Sin registrar" : `− ${money(order.paymentFee)}`],
                ["Envío / domicilio real", order.shippingCostActual === null ? "Sin registrar" : `− ${money(order.shippingCostActual)}`],
                ...order.expenses.map((expense) => [expense.concept, `− ${money(expense.amount)}`]),
              ].map(([label, value], i) => (
                <div key={`${label}-${i}`} className="flex justify-between gap-4 text-steel">
                  <dt>{label}</dt>
                  <dd className="font-mono">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-line pt-3 type-title text-lg">
                <dt>Utilidad neta</dt>
                <dd className={profit < 0 ? "font-mono text-red-300" : "font-mono text-emerald-300"}>{money(profit)}</dd>
              </div>
              <p className="text-right type-label text-steel">Margen {order.total > 0 ? ((profit / order.total) * 100).toFixed(1) : "0"}%</p>
            </dl>
            {missingCost > 0 && (
              <p className="mt-3 text-xs text-amber-200">
                {missingCost === 1 ? "1 producto no tiene costo registrado" : `${missingCost} productos no tienen costo registrado`}: la utilidad sale inflada. Agrégalo en “Editar venta”.
              </p>
            )}
          </Panel>

          <Panel index="03" title="Logística">
            <DefinitionList
              items={[
                ["Estado de fulfillment", <StatusBadge key="f" map={FULFILLMENT_STATUS} value={order.fulfillmentStatus} />],
                ["Fecha de envío", formatDateTime(order.shippedAt)],
                ["Fecha de entrega", formatDateTime(order.deliveredAt)],
                ["Cancelado", formatDateTime(order.cancelledAt)],
                ["Transportadora", order.carrier],
                [
                  "Guía",
                  order.trackingUrl ? (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-arc hover:underline">
                      {order.trackingNumber ?? "Seguimiento"} ↗
                    </a>
                  ) : (
                    order.trackingNumber
                  ),
                ],
              ]}
            />
            <div className="mt-6 border-t border-line pt-6">
              <p className="mb-4 type-label text-arc">Cambiar estado</p>
              <OrderStatusActions orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} fulfillmentStatus={order.fulfillmentStatus} />
            </div>
            <div className="mt-6 border-t border-line pt-6">
              <p className="mb-4 type-label text-arc">Datos de envío</p>
              <ShippingForm
                orderId={order.id}
                carrier={order.carrier}
                trackingNumber={order.trackingNumber}
                trackingUrl={order.trackingUrl}
                shippingCostActual={order.shippingCostActual}
              />
            </div>
          </Panel>

          <Panel index="04" title="Historial de eventos">
            <ol className="space-y-4">
              {order.events.map((event) => (
                <li key={event.id} className="relative border-l border-line-strong pl-4">
                  <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-arc" aria-hidden="true" />
                  <p className="text-sm">{EVENT_LABEL[event.type]}</p>
                  {event.message && <p className="mt-1 text-sm text-steel">{event.message}</p>}
                  <p className="mt-1 type-label text-steel/80">
                    {formatDateTime(event.createdAt)} · {event.actor}
                  </p>
                  {event.metadata && (
                    <details className="mt-2">
                      <summary className="cursor-pointer type-label text-steel/70 hover:text-arc">Metadata</summary>
                      <pre className="mt-2 overflow-x-auto rounded-sm bg-void p-3 font-mono text-[0.6875rem] text-steel">{JSON.stringify(event.metadata, null, 2)}</pre>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <section className="rounded-sm border border-red-400/20 p-5">
            <p className="type-label text-red-300">Zona de peligro</p>
            <div className="mt-3">
              <DangerAction
                action={deleteOrdersAction}
                fields={{ ids: order.id, redirectTo: "list" }}
                label="Eliminar pedido…"
                title={`¿Eliminar el pedido ${order.orderNumber}? Se borra con sus pagos e historial y no se puede deshacer.`}
                description={order.paymentStatus === "APPROVED" ? "Este pedido está PAGADO: borrarlo aquí no reembolsa ni cancela nada en Mercado Pago." : undefined}
                confirmLabel="Sí, eliminar pedido"
              />
            </div>
          </section>
          <Panel index="05" title="Cliente" action={<Link href={`/admin/customers/${order.customerId}`} className="type-label text-steel hover:text-arc">Perfil →</Link>}>
            <DefinitionList
              items={[
                ["Nombre", order.customerName],
                ["Email", order.customerEmail ? <a key="e" href={`mailto:${order.customerEmail}`} className="hover:text-arc">{order.customerEmail}</a> : null],
                ["Teléfono", order.customerPhone],
                ["Notas del cliente", order.customerNotes],
              ]}
            />
          </Panel>

          <Panel index="06" title="Entrega">
            <DefinitionList
              items={[
                ["Dirección", fullAddress],
                ["Ciudad", order.shippingCity],
                ["Departamento", order.shippingDepartment],
                ["País", order.shippingCountry === "CO" ? "Colombia" : order.shippingCountry],
                ["Código postal", order.shippingPostalCode],
                ["Recibe", [order.recipientName, order.recipientPhone].filter(Boolean).join(" · ")],
              ]}
            />
          </Panel>

          <Panel index="07" title="Pago">
            <DefinitionList
              items={[
                ["Canal de venta", salesChannelLabel(order.salesChannel)],
                ["Proveedor", PROVIDER_LABEL[order.paymentProvider] ?? order.paymentProvider],
                ["ID de pago", order.paymentId ? <span key="p" className="font-mono text-xs">{order.paymentId}</span> : null],
                ["Estado", <StatusBadge key="s" map={PAYMENT_STATUS} value={order.paymentStatus} />],
                ["Método", paymentMethodLabel(order.paymentMethod)],
                ["Fecha de pago", formatDateTime(order.paidAt)],
                ["Comisión", money(order.paymentFee)],
                ["Detalle", approvedPayment?.providerStatusDetail],
                ["Preferencia", order.mpPreferenceId ? <span key="r" className="font-mono text-xs">{order.mpPreferenceId}</span> : null],
              ]}
            />
            {order.payments.length > 1 && (
              <div className="mt-6 border-t border-line pt-4">
                <p className="type-label text-steel">Intentos de pago ({order.payments.length})</p>
                <ul className="mt-3 space-y-2">
                  {order.payments.map((payment) => (
                    <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-mono text-xs text-steel">{payment.providerPaymentId}</span>
                      <StatusBadge map={PAYMENT_STATUS} value={payment.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
