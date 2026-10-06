import "server-only";
import type { SaleCustomerOption, SaleFormValues, SaleProductOption } from "@/components/admin/SaleForm";
import { db } from "../db";

/** "YYYY-MM-DDTHH:mm" en hora de Colombia (para el campo datetime-local). */
export function bogotaInputValue(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Productos y clientes para el formulario de venta (solo admin: incluye costos). */
export async function getSaleFormOptions(): Promise<{ products: SaleProductOption[]; customers: SaleCustomerOption[] }> {
  const [products, customers] = await Promise.all([
    db.product.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], select: { id: true, name: true, sku: true, price: true, costPrice: true } }),
    db.customer.findMany({
      orderBy: { fullName: "asc" },
      take: 2000,
      select: { id: true, fullName: true, phone: true, email: true, addresses: { orderBy: { updatedAt: "desc" }, take: 1, select: { department: true, city: true, address: true } } },
    }),
  ]);
  return {
    products,
    customers: customers.map(({ addresses, ...customer }) => ({ ...customer, department: addresses[0]?.department ?? null, city: addresses[0]?.city ?? null, address: addresses[0]?.address ?? null })),
  };
}

export function emptySaleValues(): SaleFormValues {
  return {
    customer: { fullName: "", phone: "", email: "", department: "Risaralda", city: "Pereira", address: "" },
    saleDate: bogotaInputValue(new Date()),
    salesChannel: "WHATSAPP",
    paymentMethod: "transferencia",
    paymentStatus: "APPROVED",
    status: "DELIVERED",
    items: [],
    discount: 0,
    shippingCharged: 0,
    paymentFee: 0,
    shippingCostActual: null,
    expenses: [],
    notes: "",
  };
}

/** Valores del formulario a partir de una venta existente (web o manual). */
export async function getSaleValues(id: string) {
  const order = await db.order.findUnique({ where: { id }, include: { items: { orderBy: { createdAt: "asc" } }, expenses: { orderBy: { createdAt: "asc" } } } });
  if (!order) return null;
  const values: SaleFormValues = {
    id: order.id,
    customerId: order.customerId,
    customer: {
      fullName: order.customerName,
      phone: order.customerPhone ?? "",
      email: order.customerEmail ?? "",
      department: order.shippingDepartment ?? "",
      city: order.shippingCity ?? "",
      address: [order.shippingAddress, order.shippingComplement].filter(Boolean).join(", "),
    },
    saleDate: bogotaInputValue(order.createdAt),
    salesChannel: order.salesChannel,
    paymentMethod: order.paymentMethod ?? "",
    paymentStatus: order.paymentStatus,
    status: order.status,
    // Precio de lista por línea; el descuento (p. ej. de combo) se edita como total en "Descuento".
    items: order.items.map((item) => ({ productId: item.productId, name: item.productName, sku: item.sku, variant: item.variant ?? "", quantity: item.quantity, unitPrice: item.unitPrice, unitCost: item.unitCost })),
    discount: order.discount,
    shippingCharged: order.shippingCost,
    paymentFee: order.paymentFee,
    shippingCostActual: order.shippingCostActual,
    expenses: order.expenses.map((expense) => ({ concept: expense.concept, amount: expense.amount })),
    notes: order.customerNotes ?? "",
  };
  return { values, orderNumber: order.orderNumber, webOrder: order.paymentProvider !== "MANUAL" };
}
