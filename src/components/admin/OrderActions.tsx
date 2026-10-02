"use client";

import { useActionState, useState } from "react";
import type { FulfillmentStatus, OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { updateOrderStatusAction, updateShippingAction, type ActionState, type OrderAction } from "@/server/admin/actions";
import { buttonClass, ghostButtonClass, inputClass } from "./ui";

const STEPS: Array<{ action: Exclude<OrderAction, "CANCELLED">; label: string; after: FulfillmentStatus[] }> = [
  { action: "PROCESSING", label: "Preparar pedido", after: ["PENDING"] },
  { action: "READY_TO_SHIP", label: "Listo para enviar", after: ["PENDING", "PROCESSING"] },
  { action: "SHIPPED", label: "Marcar enviado", after: ["PENDING", "PROCESSING", "READY_TO_SHIP"] },
  { action: "DELIVERED", label: "Marcar entregado", after: ["SHIPPED"] },
];

function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" className="text-sm text-red-300">{state.error}</p>;
  if (state.message) return <p role="status" className="text-sm text-emerald-300">{state.message}</p>;
  return null;
}

export function OrderStatusActions({
  orderId,
  status,
  paymentStatus,
  fulfillmentStatus,
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateOrderStatusAction, {});
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (["DELIVERED", "CANCELLED", "REFUNDED"].includes(status)) {
    return <p className="text-sm text-steel">Este pedido está cerrado; no admite más cambios de estado.</p>;
  }

  const paid = paymentStatus === "APPROVED";
  const steps = paid ? STEPS.filter((step) => step.after.includes(fulfillmentStatus)) : [];

  return (
    <div className="space-y-4">
      {!paid && <p className="text-sm text-steel">El pedido avanzará cuando Mercado Pago confirme el pago.</p>}
      {steps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <form key={step.action} action={action}>
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="action" value={step.action} />
              <button disabled={pending} className={index === 0 ? buttonClass : ghostButtonClass}>
                {step.label}
              </button>
            </form>
          ))}
        </div>
      )}

      {!confirmCancel ? (
        <button type="button" onClick={() => setConfirmCancel(true)} className="type-label text-red-300/80 transition-colors hover:text-red-300">
          Cancelar pedido…
        </button>
      ) : (
        <form action={action} className="space-y-3 rounded-sm border border-red-400/30 bg-red-400/5 p-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="action" value="CANCELLED" />
          <p className="text-sm text-bone">¿Cancelar este pedido? Esta acción no se puede deshacer.</p>
          {paid && <p className="text-sm text-amber-200">El pago está aprobado: el reembolso debes hacerlo desde tu panel de Mercado Pago.</p>}
          <input name="note" placeholder="Motivo (opcional)" maxLength={500} className={inputClass} />
          <div className="flex flex-wrap gap-2">
            <button disabled={pending} className="inline-flex h-11 items-center border border-red-400/60 bg-red-500/20 px-5 type-label text-red-100 transition-colors hover:bg-red-500/30 disabled:opacity-50">
              Sí, cancelar pedido
            </button>
            <button type="button" onClick={() => setConfirmCancel(false)} className={ghostButtonClass}>
              Volver
            </button>
          </div>
        </form>
      )}
      <Feedback state={state} />
    </div>
  );
}

export function ShippingForm({
  orderId,
  carrier,
  trackingNumber,
  trackingUrl,
  shippingCostActual,
}: {
  orderId: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingCostActual: number | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateShippingAction, {});
  const field = (name: string, label: string, value: string | number | null, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="type-label text-steel">{label}</span>
      <input name={name} defaultValue={value ?? ""} className={`mt-2 ${inputClass}`} {...props} />
    </label>
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-4 sm:grid-cols-2">
        {field("carrier", "Transportadora", carrier, { maxLength: 80, placeholder: "Servientrega, Coordinadora…" })}
        {field("trackingNumber", "Número de guía", trackingNumber, { maxLength: 80 })}
        {field("trackingUrl", "URL de seguimiento", trackingUrl, { maxLength: 500, type: "url", placeholder: "https://" })}
        {field("shippingCostActual", "Costo real del envío (COP)", shippingCostActual, { inputMode: "numeric", placeholder: "Desconocido" })}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className={ghostButtonClass}>
          {pending ? "Guardando…" : "Guardar envío"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
