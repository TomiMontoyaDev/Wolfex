import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { PRODUCTS, type Product } from "@/data/products";

export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "PROCESSING" | "SHIPPED" | "DELIVERED";

export interface OrderLine {
  productId: string;
  name: string;
  sku: string;
  color: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  invoice: string;
  status: OrderStatus;
  currency: "COP";
  subtotal: number;
  shipping: number;
  total: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  lines: OrderLine[];
  createdAt: string;
  epayco?: {
    refPayco?: string;
    transactionId?: string;
    state?: string;
  };
}

const orders = new Map<string, Order>();

export function calculateOrder(lines: Array<{ productId: string; color: string; quantity: number }>) {
  if (!lines.length) throw new Error("El carrito está vacío.");

  const validatedLines = lines.map((line) => {
    const product = PRODUCTS.find((item) => item.id === line.productId);
    if (!product || !product.available) throw new Error("Uno de los productos ya no está disponible.");
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) throw new Error("Cantidad inválida.");
    return { product, color: line.color || product.colors[0]?.name || "Default", quantity: line.quantity };
  });

  const orderLines = validatedLines.map(({ product, color, quantity }) => ({
    productId: product.id,
    name: product.name,
    sku: product.sku,
    color,
    quantity,
    unitPrice: product.price,
    total: product.price * quantity,
  }));
  const subtotal = orderLines.reduce((sum, line) => sum + line.total, 0);
  const shipping = 0;

  return { orderLines, subtotal, shipping, total: subtotal + shipping };
}

export function createOrder(
  lines: Array<{ productId: string; color: string; quantity: number }>,
  customer: Order["customer"],
) {
  const calculated = calculateOrder(lines);
  const id = randomUUID();
  const order: Order = {
    id,
    invoice: `WFX-${Date.now()}-${id.slice(0, 6).toUpperCase()}`,
    status: "PENDING",
    currency: "COP",
    lines: calculated.orderLines,
    subtotal: calculated.subtotal,
    shipping: calculated.shipping,
    total: calculated.total,
    customer,
    createdAt: new Date().toISOString(),
  };
  orders.set(order.id, order);
  return order;
}

export function getOrder(id: string) {
  return orders.get(id);
}

export function updateOrder(id: string, update: Partial<Pick<Order, "status" | "epayco">>) {
  const order = orders.get(id);
  if (!order) return undefined;
  const updated = { ...order, ...update };
  orders.set(id, updated);
  return updated;
}

export function verifyEpaycoSignature(input: {
  signature: string;
  refPayco: string;
  transactionId: string;
  amount: string;
  currency: string;
}) {
  const customerId = process.env.EPAYCO_CUSTOMER_ID;
  const privateKey = process.env.EPAYCO_PRIVATE_KEY;
  if (!customerId || !privateKey) throw new Error("Faltan las credenciales privadas de ePayco en el servidor.");
  const expected = createHash("md5")
    .update(`${customerId}^${privateKey}^${input.refPayco}^${input.transactionId}^${input.amount}^${input.currency}`)
    .digest("hex");
  const received = input.signature.trim().toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export function findOrderByInvoice(invoice: string) {
  return [...orders.values()].find((order) => order.invoice === invoice);
}

export type { Product };
