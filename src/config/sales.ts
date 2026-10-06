/** Opciones de las ventas registradas a mano en el admin. Editable aquí. */

export const SALES_CHANNELS = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "PRESENCIAL", label: "Presencial / punto físico" },
  { value: "REFERIDO", label: "Referido" },
  { value: "WEB", label: "Página web" },
  { value: "OTRO", label: "Otro" },
] as const;

export type SalesChannelValue = (typeof SALES_CHANNELS)[number]["value"];

export const salesChannelLabel = (value: string | null | undefined) => SALES_CHANNELS.find((channel) => channel.value === value)?.label ?? value ?? "—";

/**
 * Medios de pago de las ventas manuales. `fee` es la comisión sugerida (se puede editar en cada venta):
 * el formulario la calcula al elegir el medio.
 */
export const MANUAL_PAYMENT_METHODS = [
  { value: "transferencia", label: "Transferencia bancaria", fee: null },
  { value: "nequi", label: "Nequi", fee: null },
  { value: "daviplata", label: "Daviplata", fee: null },
  { value: "breb", label: "Llave Bre-B", fee: null },
  { value: "efectivo", label: "Efectivo", fee: null },
  { value: "mercadopago_link", label: "Link de Mercado Pago", fee: { percent: 0.0329, fixed: 800 } },
  { value: "datafono", label: "Datáfono / tarjeta", fee: { percent: 0.0299, fixed: 900 } },
  { value: "contraentrega", label: "Contraentrega", fee: null },
  { value: "otro", label: "Otro", fee: null },
] as const;

/** Conceptos frecuentes de gastos operativos (sugerencias del formulario). */
export const EXPENSE_SUGGESTIONS = ["Envío / domicilio", "Empaque", "Publicidad", "Comisión vendedor", "Transporte", "Otro"];
