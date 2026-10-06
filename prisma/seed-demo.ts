/**
 * Datos de DEMOSTRACIÓN para ver el dashboard con información en desarrollo.
 *
 *   npm run db:seed:demo          → crea 3 productos ficticios (inactivos), 6 clientes y ~30 pedidos
 *   npm run db:seed:demo:clean    → borra todo lo creado por este script
 *
 * Todo queda marcado: productos "demo-*", clientes "@demo.wolfex.test", pedidos "DEMO-*".
 * Se niega a correr en producción.
 */
import { randomUUID } from "node:crypto";
import { prisma } from "./client";

if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
  console.error("seed-demo no se ejecuta en producción.");
  process.exit(1);
}

const DEMO_EMAIL = "@demo.wolfex.test";

async function clean() {
  const orders = await prisma.order.deleteMany({ where: { orderNumber: { startsWith: "DEMO-" } } });
  const customers = await prisma.customer.deleteMany({ where: { email: { endsWith: DEMO_EMAIL } } });
  const products = await prisma.product.deleteMany({ where: { id: { startsWith: "demo-" } } });
  console.log(`Demo eliminada: ${orders.count} pedidos, ${customers.count} clientes, ${products.count} productos.`);
}

const PRODUCTS = [
  { id: "demo-creatina-300", name: "DEMO · CREATINA MONOHIDRATO 300 G", sku: "DEMO-001", price: 89900, costPrice: 61000, category: "CREATINAS" },
  { id: "demo-whey-2lb", name: "DEMO · WHEY PROTEIN 2 LB CHOCOLATE", sku: "DEMO-002", price: 149900, costPrice: 104000, category: "PROTEINAS" },
  { id: "demo-shaker", name: "DEMO · SHAKER WOLFEX 700 ML", sku: "DEMO-003", price: 39900, costPrice: null, category: "ACCESORIOS" },
];

const CUSTOMERS = [
  ["Laura", "Gómez", "Medellín", "Antioquia"],
  ["Santiago", "Ríos", "Bogotá", "Cundinamarca"],
  ["Valentina", "Cárdenas", "Cali", "Valle del Cauca"],
  ["Andrés", "Mejía", "Bogotá", "Cundinamarca"],
  ["Camila", "Restrepo", "Envigado", "Antioquia"],
  ["Mateo", "Salazar", "Barranquilla", "Atlántico"],
] as const;

// Generador determinista para que el demo sea reproducible.
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)];

async function create() {
  await clean();
  for (const product of PRODUCTS) {
    await prisma.product.create({ data: { ...product, slug: product.id, brand: "Demo", active: false } });
  }

  const customers = [];
  for (const [first, last, city, department] of CUSTOMERS) {
    const customer = await prisma.customer.create({
      data: {
        firstName: first,
        lastName: last,
        fullName: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}${DEMO_EMAIL}`,
        phone: `+57 300 ${Math.floor(1000000 + rand() * 8999999)}`,
        addresses: { create: { city, department, address: `Calle ${Math.floor(rand() * 120) + 1} # ${Math.floor(rand() * 90) + 1}-${Math.floor(rand() * 90) + 1}` } },
      },
      include: { addresses: true },
    });
    customers.push(customer);
  }

  const now = Date.now();
  for (let i = 0; i < 30; i++) {
    const customer = pick(customers);
    const address = customer.addresses[0];
    const createdAt = new Date(now - Math.floor(rand() * 60 * 24 * 60 * 60 * 1000));
    const lines = Array.from({ length: 1 + Math.floor(rand() * 2) }, () => ({ product: pick(PRODUCTS), quantity: 1 + Math.floor(rand() * 2) }));
    const items = lines.map(({ product, quantity }) => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      unitCost: product.costPrice,
    }));
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const roll = rand();
    const paid = roll > 0.25;
    const status = !paid ? "PENDING" : roll > 0.8 ? "DELIVERED" : roll > 0.6 ? "SHIPPED" : roll > 0.45 ? "PROCESSING" : "CONFIRMED";
    const fulfillment = status === "DELIVERED" ? "DELIVERED" : status === "SHIPPED" ? "SHIPPED" : status === "PROCESSING" ? "PROCESSING" : "PENDING";
    const paidAt = paid ? new Date(createdAt.getTime() + 5 * 60 * 1000) : null;
    const paymentId = paid ? String(9_000_000_000 + i) : null;
    const fee = paid ? Math.round(total * 0.0329 + 952) : null;

    await prisma.order.create({
      data: {
        orderNumber: `DEMO-${String(i + 1).padStart(4, "0")}`,
        externalReference: randomUUID(),
        customerId: customer.id,
        addressId: address.id,
        status,
        paymentStatus: paid ? "APPROVED" : roll > 0.12 ? "PENDING" : "REJECTED",
        fulfillmentStatus: fulfillment,
        subtotal: total,
        total,
        paymentMethod: paid ? pick(["visa", "master", "pse", "nequi"]) : null,
        paymentId,
        paymentFee: fee,
        customerName: customer.fullName,
        customerEmail: customer.email ?? "",
        customerPhone: customer.phone,
        shippingCity: address.city,
        shippingDepartment: address.department,
        shippingAddress: address.address,
        recipientName: customer.fullName,
        recipientPhone: customer.phone,
        createdAt,
        paidAt,
        shippedAt: status === "SHIPPED" || status === "DELIVERED" ? new Date(createdAt.getTime() + 86400000) : null,
        deliveredAt: status === "DELIVERED" ? new Date(createdAt.getTime() + 3 * 86400000) : null,
        items: { create: items.map((item) => ({ ...item, createdAt })) },
        payments: paid
          ? { create: { providerPaymentId: paymentId!, status: "APPROVED", providerStatus: "approved", providerStatusDetail: "accredited", amount: total, currency: "COP", feeAmount: fee, approvedAt: paidAt, createdAt } }
          : undefined,
        events: {
          create: [
            { type: "ORDER_CREATED", actor: "checkout", createdAt },
            ...(paid ? [{ type: "PAYMENT_APPROVED" as const, actor: "webhook", createdAt: paidAt! }, { type: "ORDER_CONFIRMED" as const, actor: "webhook", createdAt: paidAt! }] : []),
          ],
        },
      },
    });
  }
  console.log(`Demo creada: ${PRODUCTS.length} productos (inactivos), ${customers.length} clientes, 30 pedidos.`);
}

(process.argv.includes("--clean") ? clean() : create())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
