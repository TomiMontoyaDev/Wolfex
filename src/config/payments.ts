import { WHATSAPP_PAGOS, formatWhatsapp } from "@/lib/site-config";

/**
 * Pago por transferencia o llave (método alterno a Mercado Pago).
 * El titular va SOLO enmascarado: el nombre completo no debe aparecer en el código ni en la página.
 */
export const TRANSFER_DETAILS = {
  bank: "Bancolombia",
  accountType: "Cuenta de Ahorros",
  accountNumber: "912-853413-75",
  key: "@tomas0231",
  holderMasked: "Tom*** Mon*** Bui***",
} as const;

/**
 * Métodos de pago que ofrece el checkout, en este orden. La transferencia va primero y destacada:
 * no tiene comisión (Mercado Pago cobra 3,29% + $800 por venta).
 */
export const PAYMENT_METHODS: Record<"TRANSFER" | "MERCADOPAGO" | "PICKUP", { label: string; hint: string; badge?: string }> = {
  TRANSFER: {
    label: "Transferencia · Nequi · Bre-B",
    hint: `Bancolombia, Nequi o llave Bre-B · confirmación inmediata por WhatsApp ${formatWhatsapp(WHATSAPP_PAGOS)}`,
    badge: "Recomendado",
  },
  MERCADOPAGO: { label: "Mercado Pago", hint: "Tarjeta, PSE, Nequi y más · confirmación inmediata" },
  PICKUP: { label: "Recoger y pagar en Pereira", hint: "Coordinamos la hora y el lugar por WhatsApp" },
};

export type CheckoutPaymentMethod = keyof typeof PAYMENT_METHODS;

/** Ciudad donde se puede recoger el pedido. */
export const PICKUP_CITY = "Pereira";
