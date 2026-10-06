import { formatDateTime } from "@/components/admin/format";
import { WolfMark, Wordmark } from "@/components/visuals/WolfMark";
import { productSize } from "@/lib/product-size";
import { CONTACT } from "@/lib/site-config";
import { formatPrice } from "@/lib/utils";
import { billingParty, paymentLabel, shippingLabel, type InvoiceOrder } from "@/server/admin/invoices";

/**
 * Comprobante de venta imprimible. NO es una factura electrónica: si ya se expidió la factura real,
 * se muestra su número y CUFE como referencia.
 */
export function Receipt({ order }: { order: InvoiceOrder }) {
  const party = billingParty(order);

  return (
    <article className="receipt-page mx-auto my-8 w-[216mm] max-w-full bg-white p-[15mm] text-[11px] leading-snug text-neutral-900 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <header className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-4">
        <div className="flex items-center gap-3">
          <WolfMark outline className="h-10 w-auto text-neutral-900" />
          <Wordmark className="h-5 w-auto text-neutral-900" title="WOLFEX" />
        </div>
        <div className="text-right">
          <p className="text-[15px] font-bold tracking-wide">COMPROBANTE DE VENTA</p>
          <p className="mt-1 font-mono text-[13px]">{order.receiptNumber ?? "—"}</p>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Vendedor</p>
          <p className="mt-1 font-semibold">{CONTACT.owner}</p>
          <p>{CONTACT.city}</p>
          <p>WhatsApp {CONTACT.whatsapp.display}</p>
          <p>{CONTACT.email}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Pedido</p>
          <dl className="mt-1 space-y-0.5">
            <Pair label="Fecha del pedido">{formatDateTime(order.createdAt)}</Pair>
            <Pair label="No. de pedido">{order.orderNumber}</Pair>
            <Pair label="Medio de pago">{paymentLabel(order)}</Pair>
            <Pair label="ID de pago">{order.paymentId ?? "—"}</Pair>
          </dl>
        </div>
      </section>

      <section className="mt-4 border border-neutral-300 p-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Cliente</p>
        <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-0.5">
          <Pair label="Nombre / razón social">{party.name}</Pair>
          {party.document && <Pair label="Documento">{party.document}</Pair>}
          {party.personType && <Pair label="Tipo de persona">{party.personType}</Pair>}
          <Pair label="Correo">{party.email}</Pair>
          <Pair label="Teléfono">{party.phone ?? "—"}</Pair>
          <Pair label="Dirección">{party.address}</Pair>
        </div>
      </section>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-neutral-900 text-left text-[9px] uppercase tracking-widest text-neutral-600">
            <th className="py-1.5 pr-2 font-bold">Producto</th>
            <th className="py-1.5 pr-2 font-bold">Sabor / presentación</th>
            <th className="py-1.5 pr-2 text-right font-bold">Cant.</th>
            <th className="py-1.5 pr-2 text-right font-bold">Valor unitario</th>
            <th className="py-1.5 text-right font-bold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-200 align-top">
              <td className="py-1.5 pr-2">
                {item.productName}
                <span className="block font-mono text-[9px] text-neutral-500">{item.sku}</span>
              </td>
              <td className="py-1.5 pr-2">{item.variant || productSize(item.productName).join(" · ") || "—"}</td>
              <td className="py-1.5 pr-2 text-right font-mono">{item.quantity}</td>
              <td className="py-1.5 pr-2 text-right font-mono">{formatPrice(item.unitPrice)}</td>
              <td className="py-1.5 text-right font-mono">{formatPrice(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-3 w-64 space-y-1">
        <Total label="Subtotal">{formatPrice(order.subtotal)}</Total>
        <Total label="Envío">{shippingLabel(order)}</Total>
        <Total label={order.discount ? "Descuento combo" : "Descuentos"}>{order.discount ? `- ${formatPrice(order.discount)}` : formatPrice(0)}</Total>
        <div className="flex justify-between border-t-2 border-neutral-900 pt-1.5 text-[13px] font-bold">
          <dt>Total</dt>
          <dd className="font-mono">{formatPrice(order.total)}</dd>
        </div>
      </dl>

      {order.invoiceStatus === "EMITIDA" && order.dianInvoiceNumber && (
        <p className="mt-4 break-all border border-neutral-900 px-3 py-2 font-semibold">
          Factura electrónica No. {order.dianInvoiceNumber} · CUFE: {order.cufe}
        </p>
      )}

      <footer className="mt-6 border-t border-neutral-300 pt-3 text-center text-[10px] text-neutral-600">
        <p className="font-semibold text-neutral-800">Este documento es un comprobante de venta y no reemplaza la factura electrónica de venta.</p>
        <p className="mt-1">
          WOLFEX · {CONTACT.owner} · {CONTACT.city} · WhatsApp {CONTACT.whatsapp.display} · {CONTACT.email} · Instagram {CONTACT.instagram.handle}
        </p>
      </footer>
    </article>
  );
}

function Pair({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-neutral-500">{label}:</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

function Total({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="font-mono">{children}</dd>
    </div>
  );
}

/** Estilos de impresión: carta, márgenes de 15 mm, un comprobante por página y sin la decoración del panel. */
export const RECEIPT_PRINT_CSS = `
@media print {
  @page { size: letter; margin: 15mm; }
  html, body, body * { background: transparent !important; box-shadow: none !important; }
  .grain, .no-print { display: none !important; }
  .receipt-page { margin: 0 !important; padding: 0 !important; width: auto !important; max-width: none !important; }
  .receipt-page:not(:last-child) { page-break-after: always; break-after: page; }
}`;
