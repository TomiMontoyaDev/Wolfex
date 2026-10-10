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

/** Métodos de pago que ofrece el checkout. */
export const PAYMENT_METHODS = {
  MERCADOPAGO: { label: "Mercado Pago", hint: "Tarjeta, PSE, Nequi y más · confirmación inmediata" },
  TRANSFER: { label: "Transferencia o llave", hint: "Bancolombia / Nequi / Bre-B · envías el comprobante por WhatsApp" },
  PICKUP: { label: "Recoger y pagar en Pereira", hint: "Coordinamos la hora y el lugar por WhatsApp" },
} as const;

export type CheckoutPaymentMethod = keyof typeof PAYMENT_METHODS;

/** Ciudad donde se puede recoger el pedido. */
export const PICKUP_CITY = "Pereira";
