"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { EXPENSE_SUGGESTIONS, MANUAL_PAYMENT_METHODS, SALES_CHANNELS } from "@/config/sales";
import { DEPARTMENTS } from "@/data/colombia";
import { cn, formatPrice } from "@/lib/utils";
import type { ActionState } from "@/server/admin/actions";
import { saveSaleAction } from "@/server/admin/sale-actions";
import { buttonClass, ghostButtonClass, inputClass } from "./ui";

export interface SaleProductOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number | null;
}

export interface SaleCustomerOption {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  department: string | null;
  city: string | null;
  address: string | null;
}

interface ItemRow {
  key: string;
  productId: string | null;
  label: string;
  name: string;
  sku: string;
  variant: string;
  quantity: string;
  unitPrice: string;
  unitCost: string;
}

export interface SaleFormValues {
  id?: string;
  customerId?: string;
  customer: { fullName: string; phone: string; email: string; department: string; city: string; address: string };
  saleDate: string;
  salesChannel: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  items: Array<{ productId: string | null; name: string; sku: string; variant: string; quantity: number; unitPrice: number; unitCost: number | null }>;
  discount: number;
  shippingCharged: number;
  paymentFee: number | null;
  shippingCostActual: number | null;
  expenses: Array<{ concept: string; amount: number }>;
  notes: string;
}

const PAYMENT_STATUSES = [
  { value: "APPROVED", label: "Pagado" },
  { value: "PENDING", label: "Pendiente de pago" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "REFUNDED", label: "Reembolsado" },
  { value: "REJECTED", label: "Rechazado" },
];
const ORDER_STATUSES = [
  { value: "DELIVERED", label: "Entregado" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "PROCESSING", label: "Preparando" },
  { value: "CONFIRMED", label: "Confirmado (por preparar)" },
  { value: "PENDING", label: "Pendiente" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "REFUNDED", label: "Reembolsado" },
];

const toInt = (value: string) => {
  const n = Number(value.replace(/[.\s$,]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
};
const optionLabel = (product: SaleProductOption) => `${product.sku} · ${product.name}`;
let rowSeq = 0;
const newKey = () => `row-${++rowSeq}`;

/** Formulario de venta: crea ventas manuales y edita cualquier venta (todo modificable). */
export function SaleForm({
  values,
  products,
  customers,
  webOrder = false,
}: {
  values: SaleFormValues;
  products: SaleProductOption[];
  customers: SaleCustomerOption[];
  /** Venta de la tienda web (Mercado Pago): la fecha y el cliente vinculado no se cambian. */
  webOrder?: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSaleAction, {});
  const editing = Boolean(values.id);
  const byLabel = useMemo(() => new Map(products.map((product) => [optionLabel(product), product])), [products]);

  const [customerId, setCustomerId] = useState(values.customerId ?? "");
  const [customer, setCustomer] = useState(values.customer);
  const [saleDate, setSaleDate] = useState(values.saleDate);
  const [salesChannel, setSalesChannel] = useState(values.salesChannel);
  const [paymentMethod, setPaymentMethod] = useState(values.paymentMethod);
  const [paymentStatus, setPaymentStatus] = useState(values.paymentStatus);
  const [status, setStatus] = useState(values.status);
  const [items, setItems] = useState<ItemRow[]>(() =>
    (values.items.length ? values.items : [{ productId: null, name: "", sku: "", variant: "", quantity: 1, unitPrice: 0, unitCost: null }]).map((item) => {
      const product = item.productId ? products.find((option) => option.id === item.productId) : undefined;
      return {
        key: newKey(),
        productId: item.productId,
        label: product ? optionLabel(product) : item.name,
        name: item.name,
        sku: item.sku,
        variant: item.variant,
        quantity: String(item.quantity),
        unitPrice: item.unitPrice ? String(item.unitPrice) : "",
        unitCost: item.unitCost === null ? "" : String(item.unitCost),
      };
    }),
  );
  const [discount, setDiscount] = useState(values.discount ? String(values.discount) : "");
  const [shippingCharged, setShippingCharged] = useState(values.shippingCharged ? String(values.shippingCharged) : "");
  const [paymentFee, setPaymentFee] = useState(values.paymentFee === null ? "" : String(values.paymentFee));
  const [shippingCostActual, setShippingCostActual] = useState(values.shippingCostActual === null ? "" : String(values.shippingCostActual));
  const [expenses, setExpenses] = useState(values.expenses.map((expense) => ({ key: newKey(), concept: expense.concept, amount: String(expense.amount) })));
  const [notes, setNotes] = useState(values.notes);

  // ── Totales y utilidad en vivo ──
  const subtotal = items.reduce((sum, item) => sum + toInt(item.unitPrice) * Math.max(0, toInt(item.quantity)), 0);
  const total = subtotal - toInt(discount) + toInt(shippingCharged);
  const productCost = items.reduce((sum, item) => sum + toInt(item.unitCost) * Math.max(0, toInt(item.quantity)), 0);
  const missingCost = items.filter((item) => item.unitCost === "").length;
  const expensesTotal = expenses.reduce((sum, expense) => sum + toInt(expense.amount), 0);
  const costs = productCost + toInt(paymentFee) + toInt(shippingCostActual) + expensesTotal;
  const profit = total - costs;
  const margin = total > 0 ? profit / total : 0;

  const updateItem = (key: string, patch: Partial<ItemRow>) => setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  /** Al elegir un producto del catálogo se llenan nombre, precio y costo (todo sigue siendo editable). */
  function pickProduct(key: string, label: string) {
    const product = byLabel.get(label);
    if (product) updateItem(key, { label, productId: product.id, name: product.name, sku: product.sku, unitPrice: String(product.price), unitCost: product.costPrice === null ? "" : String(product.costPrice) });
    else updateItem(key, { label, productId: null, name: label, sku: "" });
  }

  /** Comisión sugerida según el medio de pago (editable). */
  function suggestedFee(method: string, amount: number) {
    const preset = MANUAL_PAYMENT_METHODS.find((option) => option.value === method)?.fee;
    return preset ? Math.round(amount * preset.percent + preset.fixed) : 0;
  }

  function chooseCustomer(id: string) {
    setCustomerId(id);
    const found = customers.find((option) => option.id === id);
    if (found) setCustomer({ fullName: found.fullName, phone: found.phone ?? "", email: found.email ?? "", department: found.department ?? "", city: found.city ?? "", address: found.address ?? "" });
  }

  const payload = {
    ...(values.id && { id: values.id }),
    ...(!editing && customerId && { customerId }),
    customer,
    saleDate,
    salesChannel,
    paymentMethod,
    paymentStatus,
    status,
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name || item.label,
      sku: item.sku,
      variant: item.variant,
      quantity: toInt(item.quantity),
      unitPrice: toInt(item.unitPrice),
      unitCost: item.unitCost === "" ? null : toInt(item.unitCost),
    })),
    discount: toInt(discount),
    shippingCharged: toInt(shippingCharged),
    paymentFee: paymentFee === "" ? null : toInt(paymentFee),
    shippingCostActual: shippingCostActual === "" ? null : toInt(shippingCostActual),
    expenses: expenses.filter((expense) => expense.concept || expense.amount).map((expense) => ({ concept: expense.concept, amount: toInt(expense.amount) })),
    notes,
  };

  const field = `mt-1.5 ${inputClass}`;
  const label = "type-label text-steel";
  const methodOptions = MANUAL_PAYMENT_METHODS.some((option) => option.value === paymentMethod) || !paymentMethod ? MANUAL_PAYMENT_METHODS : [...MANUAL_PAYMENT_METHODS, { value: paymentMethod, label: paymentMethod, fee: null }];

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <datalist id="sale-products">
        {products.map((product) => (
          <option key={product.id} value={optionLabel(product)} />
        ))}
      </datalist>
      <datalist id="expense-concepts">
        {EXPENSE_SUGGESTIONS.map((concept) => (
          <option key={concept} value={concept} />
        ))}
      </datalist>

      <div className="min-w-0 space-y-6">
        {/* ── Cliente ── */}
        <section className="rounded-sm border border-line-strong bg-ink/80 p-5 sm:p-6">
          <p className="type-label text-arc">01 · Cliente</p>
          {!editing && (
            <label className="mt-4 block">
              <span className={label}>Cliente existente</span>
              <select value={customerId} onChange={(event) => chooseCustomer(event.target.value)} className={`${field} appearance-none`}>
                <option value="">— Cliente nuevo —</option>
                {customers.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.fullName}
                    {option.phone ? ` · ${option.phone}` : ""}
                    {option.email ? ` · ${option.email}` : ""}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-xs text-steel">Si no está en la lista, llena los datos abajo y se crea solo al guardar.</span>
            </label>
          )}
          {editing && <p className="mt-2 text-xs text-steel">Estos son los datos guardados en la venta. Para cambiar el perfil del cliente usa su página en Clientes.</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={label}>Nombre completo *</span>
              <input required value={customer.fullName} onChange={(event) => setCustomer({ ...customer, fullName: event.target.value })} className={field} />
            </label>
            <label className="block">
              <span className={label}>Teléfono / WhatsApp</span>
              <input value={customer.phone} inputMode="tel" onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} className={field} />
            </label>
            <label className="block">
              <span className={label}>Correo (opcional)</span>
              <input type="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} className={field} />
            </label>
            <label className="block">
              <span className={label}>Departamento</span>
              <select value={customer.department} onChange={(event) => setCustomer({ ...customer, department: event.target.value })} className={`${field} appearance-none`}>
                <option value="">—</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Ciudad</span>
              <input value={customer.city} onChange={(event) => setCustomer({ ...customer, city: event.target.value })} className={field} />
            </label>
            <label className="block sm:col-span-2">
              <span className={label}>Dirección (opcional)</span>
              <input value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} className={field} />
            </label>
          </div>
        </section>

        {/* ── Venta ── */}
        <section className="rounded-sm border border-line-strong bg-ink/80 p-5 sm:p-6">
          <p className="type-label text-arc">02 · Venta</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Fecha y hora de la venta</span>
              <input type="datetime-local" required disabled={webOrder} value={saleDate} onChange={(event) => setSaleDate(event.target.value)} className={cn(field, "disabled:opacity-60")} />
              {webOrder && <span className="mt-1.5 block text-xs text-steel">Venta web: la fecha la puso Mercado Pago.</span>}
            </label>
            <label className="block">
              <span className={label}>Canal de venta</span>
              <select value={salesChannel} onChange={(event) => setSalesChannel(event.target.value)} className={`${field} appearance-none`}>
                {SALES_CHANNELS.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Medio de pago</span>
              <select
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value);
                  setPaymentFee(String(suggestedFee(event.target.value, total)));
                }}
                className={`${field} appearance-none`}
              >
                <option value="">—</option>
                {methodOptions.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Estado del pago</span>
              <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className={`${field} appearance-none`}>
                {PAYMENT_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>Estado del pedido</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${field} appearance-none`}>
                {ORDER_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* ── Productos ── */}
        <section className="rounded-sm border border-line-strong bg-ink/80 p-5 sm:p-6">
          <p className="type-label text-arc">03 · Productos</p>
          <p className="mt-1 text-xs text-steel">Busca por código o nombre: se llenan el precio y el costo del catálogo, y puedes cambiarlos. También puedes escribir un producto que no esté en el catálogo.</p>
          <div className="mt-4 space-y-3">
            {items.map((item, index) => {
              const lineTotal = toInt(item.unitPrice) * Math.max(0, toInt(item.quantity));
              const lineProfit = lineTotal - toInt(item.unitCost) * Math.max(0, toInt(item.quantity));
              return (
                <div key={item.key} className="rounded-sm border border-line p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-3 font-mono text-xs text-steel">{String(index + 1).padStart(2, "0")}</span>
                    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                      <label className="block">
                        <span className={label}>Producto *</span>
                        <input required list="sale-products" value={item.label} onChange={(event) => pickProduct(item.key, event.target.value)} placeholder="PN-381 o creatina…" className={field} />
                        {item.productId ? <span className="mt-1 block text-xs text-arc">Del catálogo · {item.sku}</span> : item.label && <span className="mt-1 block text-xs text-amber-200">Producto libre (no está en el catálogo)</span>}
                      </label>
                      <label className="block">
                        <span className={label}>Sabor / presentación</span>
                        <input value={item.variant} onChange={(event) => updateItem(item.key, { variant: event.target.value })} className={field} />
                      </label>
                    </div>
                    <button type="button" onClick={() => setItems((rows) => (rows.length > 1 ? rows.filter((row) => row.key !== item.key) : rows))} aria-label="Quitar producto" className="mt-7 flex h-9 w-9 items-center justify-center text-steel hover:text-red-300">
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 pl-6 pr-11">
                    <label className="block">
                      <span className={label}>Cantidad</span>
                      <input required inputMode="numeric" value={item.quantity} onChange={(event) => updateItem(item.key, { quantity: event.target.value.replace(/\D/g, "") })} className={field} />
                    </label>
                    <label className="block">
                      <span className={label}>Precio unit.</span>
                      <input required inputMode="numeric" value={item.unitPrice} onChange={(event) => updateItem(item.key, { unitPrice: event.target.value.replace(/\D/g, "") })} className={field} />
                    </label>
                    <label className="block">
                      <span className={label}>Costo unit.</span>
                      <input inputMode="numeric" value={item.unitCost} onChange={(event) => updateItem(item.key, { unitCost: event.target.value.replace(/\D/g, "") })} placeholder="Sin costo" className={field} />
                    </label>
                  </div>
                  <p className="mt-2 pl-6 text-xs text-steel">
                    Total línea <span className="font-mono text-bone">{formatPrice(lineTotal)}</span>
                    {item.unitCost !== "" && (
                      <>
                        {" "}· ganancia bruta <span className={cn("font-mono", lineProfit < 0 ? "text-red-300" : "text-emerald-300")}>{formatPrice(lineProfit)}</span>
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setItems((rows) => [...rows, { key: newKey(), productId: null, label: "", name: "", sku: "", variant: "", quantity: "1", unitPrice: "", unitCost: "" }])}
            className={`${ghostButtonClass} mt-4`}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Agregar producto
          </button>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Descuento (COP)</span>
              <input inputMode="numeric" value={discount} onChange={(event) => setDiscount(event.target.value.replace(/\D/g, ""))} placeholder="0" className={field} />
            </label>
            <label className="block">
              <span className={label}>Envío cobrado al cliente</span>
              <input inputMode="numeric" value={shippingCharged} onChange={(event) => setShippingCharged(event.target.value.replace(/\D/g, ""))} placeholder="0" className={field} />
            </label>
          </div>
        </section>

        {/* ── Costos y gastos ── */}
        <section className="rounded-sm border border-line-strong bg-ink/80 p-5 sm:p-6">
          <p className="type-label text-arc">04 · Costos y gastos operativos</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Comisión del medio de pago</span>
              <span className="mt-1.5 flex gap-2">
                <input inputMode="numeric" value={paymentFee} onChange={(event) => setPaymentFee(event.target.value.replace(/\D/g, ""))} placeholder="0" className={inputClass} />
                <button type="button" onClick={() => setPaymentFee(String(suggestedFee(paymentMethod, total)))} className={`${ghostButtonClass} shrink-0 px-3`}>
                  Calcular
                </button>
              </span>
              <span className="mt-1.5 block text-xs text-steel">Link de Mercado Pago: 3,29% + $800 · Datáfono: 2,99% + $900 · Transferencia y efectivo: $0.</span>
            </label>
            <label className="block">
              <span className={label}>Costo real del envío / domicilio</span>
              <input inputMode="numeric" value={shippingCostActual} onChange={(event) => setShippingCostActual(event.target.value.replace(/\D/g, ""))} placeholder="0" className={field} />
            </label>
          </div>
          <p className="mt-5 type-label text-steel">Otros gastos operativos</p>
          <div className="mt-2 space-y-2">
            {expenses.map((expense) => (
              <div key={expense.key} className="flex gap-2">
                <input list="expense-concepts" value={expense.concept} onChange={(event) => setExpenses((rows) => rows.map((row) => (row.key === expense.key ? { ...row, concept: event.target.value } : row)))} placeholder="Empaque, publicidad…" className={inputClass} />
                <input inputMode="numeric" value={expense.amount} onChange={(event) => setExpenses((rows) => rows.map((row) => (row.key === expense.key ? { ...row, amount: event.target.value.replace(/\D/g, "") } : row)))} placeholder="$" className={`${inputClass} w-36 shrink-0`} />
                <button type="button" onClick={() => setExpenses((rows) => rows.filter((row) => row.key !== expense.key))} aria-label="Quitar gasto" className="flex h-11 w-11 shrink-0 items-center justify-center text-steel hover:text-red-300">
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setExpenses((rows) => [...rows, { key: newKey(), concept: "", amount: "" }])} className={`${ghostButtonClass} mt-3`}>
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Agregar gasto
          </button>
          <label className="mt-5 block">
            <span className={label}>Notas</span>
            <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className={`${field} h-auto py-3`} />
          </label>
        </section>
      </div>

      {/* ── Resumen en vivo ── */}
      <aside className="self-start rounded-sm border border-volt/30 bg-ink p-5 xl:sticky xl:top-8">
        <p className="type-label text-arc">Resumen</p>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Subtotal" value={formatPrice(subtotal)} />
          {toInt(discount) > 0 && <Row label="Descuento" value={`− ${formatPrice(toInt(discount))}`} />}
          {toInt(shippingCharged) > 0 && <Row label="Envío cobrado" value={formatPrice(toInt(shippingCharged))} />}
          <div className="flex justify-between border-t border-line pt-2 type-title text-lg text-bone">
            <dt>Total venta</dt>
            <dd className="font-mono">{formatPrice(total)}</dd>
          </div>
        </dl>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <Row label="Costo de productos" value={`− ${formatPrice(productCost)}`} />
          <Row label="Comisión medio de pago" value={`− ${formatPrice(toInt(paymentFee))}`} />
          <Row label="Envío / domicilio" value={`− ${formatPrice(toInt(shippingCostActual))}`} />
          <Row label="Gastos operativos" value={`− ${formatPrice(expensesTotal)}`} />
          <div className="flex justify-between border-t border-line pt-2 type-title text-lg">
            <dt>Utilidad neta</dt>
            <dd className={cn("font-mono", profit < 0 ? "text-red-300" : "text-emerald-300")}>{formatPrice(profit)}</dd>
          </div>
          <p className="text-right type-label text-steel">Margen neto {(margin * 100).toFixed(1)}%</p>
        </dl>
        {missingCost > 0 && <p className="mt-3 text-xs text-amber-200">{missingCost === 1 ? "1 producto no tiene costo" : `${missingCost} productos no tienen costo`}: la utilidad saldría inflada.</p>}
        {webOrder && <p className="mt-3 text-xs text-steel">Venta web: cambiar valores aquí no modifica lo que se cobró en Mercado Pago.</p>}
        {state.error && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {state.error}
          </p>
        )}
        <button disabled={pending} className={`${buttonClass} mt-5 w-full`}>
          {pending ? "Guardando…" : editing ? "Guardar cambios" : "Registrar venta"}
        </button>
        <Link href={values.id ? `/admin/orders/${values.id}` : "/admin/orders"} className="mt-3 block text-center type-label text-steel hover:text-arc">
          Cancelar
        </Link>
      </aside>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-steel">
      <dt>{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
