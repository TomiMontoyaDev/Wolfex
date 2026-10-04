import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENT_LABEL, FULFILLMENT_STATUS, ORDER_STATUS, PAYMENT_STATUS, formatDateTime, money, paymentMethodLabel } from "@/components/admin/format";
import { DangerAction } from "@/components/admin/DeleteControls";
import { OrderStatusActions, ShippingForm } from "@/components/admin/OrderActions";
import { deleteOrdersAction } from "@/server/admin/actions";
import { DefinitionList, PageHeader, Panel, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { FREE_SHIPPING_MIN } from "@/data/site";
import { getOrder } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Pedido" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const approvedPayment = order.payments.find((payment) => payment.providerPaymentId === order.paymentId) ?? order.payments[0];
  const fullAddress = [order.shippingAddress, order.shippingComplement, order.shippingNeighborhood].filter(Boolean).join(", ");

  return (
    <>
      <Link href="/admin/orders" className="type-label text-steel transition-colors hover:text-arc">← Pedidos</Link>
      <div className="mt-4">
        <PageHeader
          eyebrow={`PEDIDO · ${formatDateTime(order.createdAt)}`}
          title={order.orderNumber}
          actions={
            <>
              <StatusBadge map={PAYMENT_STATUS} value={order.paymentStatus} />
              <StatusBadge map={ORDER_STATUS} value={order.status} />
              <StatusBadge map={FULFILLMENT_STATUS} value={order.fulfillmentStatus} />
            </>
          }
        />
      </div>

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
                ["Descuento", order.discount ? `− ${money(order.discount)}` : money(0)],
                ["Envío", order.shippingCost ? money(order.shippingCost) : order.subtotal >= FREE_SHIPPING_MIN ? "Gratis" : "Se cobra aparte (según producto y localidad)"],
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
          </Panel>

          <Panel index="02" title="Logística">
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

          <Panel index="03" title="Historial de eventos">
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
          <Panel index="04" title="Cliente" action={<Link href={`/admin/customers/${order.customerId}`} className="type-label text-steel hover:text-arc">Perfil →</Link>}>
            <DefinitionList
              items={[
                ["Nombre", order.customerName],
                ["Email", <a key="e" href={`mailto:${order.customerEmail}`} className="hover:text-arc">{order.customerEmail}</a>],
                ["Teléfono", order.customerPhone],
                ["Notas del cliente", order.customerNotes],
              ]}
            />
          </Panel>

          <Panel index="05" title="Entrega">
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

          <Panel index="06" title="Pago">
            <DefinitionList
              items={[
                ["Proveedor", "Mercado Pago"],
                ["ID de pago", order.paymentId ? <span key="p" className="font-mono text-xs">{order.paymentId}</span> : null],
                ["Estado", <StatusBadge key="s" map={PAYMENT_STATUS} value={order.paymentStatus} />],
                ["Método", paymentMethodLabel(order.paymentMethod)],
                ["Fecha de pago", formatDateTime(order.paidAt)],
                ["Comisión MP", money(order.paymentFee)],
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
