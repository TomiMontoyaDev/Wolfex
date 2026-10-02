import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { db } from "../db";
import { addDays, localDayKey, parseLocalDate, startOfDay, startOfMonth } from "./time";

// "Venta" = pedido con pago aprobado (los reembolsados quedan fuera), fechado por paidAt.
const PAID = { paymentStatus: "APPROVED" } as const;

const iso = (date: Date) => date.toISOString();

function pick<T extends string>(values: Record<string, T>, value: string | undefined) {
  return value && (Object.values(values) as string[]).includes(value) ? (value as T) : undefined;
}

async function salesBetween(from: Date, to: Date) {
  const result = await db.order.aggregate({ where: { ...PAID, paidAt: { gte: from, lt: to } }, _sum: { total: true }, _count: true });
  const revenue = result._sum.total ?? 0;
  return { revenue, orders: result._count, avgTicket: result._count ? Math.round(revenue / result._count) : 0 };
}

/**
 * Utilidad estimada = ingresos − costo de productos − comisión MP − costo real de envío.
 * Solo usa costos conocidos; `complete` indica si faltó alguno (no se inventan costos).
 */
export async function getProfitEstimate(from: Date, to: Date) {
  const [items] = await db.$queryRaw<Array<{ cost: number; missing: number; lines: number }>>`
    SELECT COALESCE(SUM(oi."unitCost" * oi.quantity), 0)::float8 AS cost,
           COUNT(*) FILTER (WHERE oi."unitCost" IS NULL)::int AS missing,
           COUNT(*)::int AS lines
    FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
    WHERE o."paymentStatus" = 'APPROVED' AND o."paidAt" >= ${iso(from)}::timestamp AND o."paidAt" < ${iso(to)}::timestamp`;
  const orders = await db.order.aggregate({
    where: { ...PAID, paidAt: { gte: from, lt: to } },
    _sum: { total: true, paymentFee: true, shippingCostActual: true },
    _count: { _all: true, paymentFee: true },
  });
  const revenue = orders._sum.total ?? 0;
  const productCost = items?.cost ?? 0;
  const fees = orders._sum.paymentFee ?? 0;
  const shipping = orders._sum.shippingCostActual ?? 0;
  return {
    revenue,
    productCost,
    fees,
    shipping,
    profit: revenue - productCost - fees - shipping,
    complete: (items?.missing ?? 0) === 0 && orders._count.paymentFee === orders._count._all,
    hasAnyCost: (items?.lines ?? 0) > (items?.missing ?? 0),
    missingCostLines: items?.missing ?? 0,
  };
}

export async function getDashboardStats(now = new Date()) {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const weekStart = addDays(today, -6);
  const monthStart = startOfMonth(now);
  const prevMonthStart = startOfMonth(now, -1);
  // Mes anterior hasta el mismo punto transcurrido, para comparar de forma justa.
  const prevMonthCutoff = new Date(Math.min(prevMonthStart.getTime() + (now.getTime() - monthStart.getTime()), monthStart.getTime()));

  const [todaySales, yesterdaySales, week, prevWeek, month, prevMonth, statusGroups, paymentGroups, customers, newCustomers, prevNewCustomers, profit, recentOrders, recentEvents] =
    await Promise.all([
      salesBetween(today, tomorrow),
      salesBetween(addDays(today, -1), today),
      salesBetween(weekStart, tomorrow),
      salesBetween(addDays(weekStart, -7), weekStart),
      salesBetween(monthStart, tomorrow),
      salesBetween(prevMonthStart, prevMonthCutoff),
      db.order.groupBy({ by: ["status"], _count: true }),
      db.order.groupBy({ by: ["paymentStatus"], _count: true }),
      db.customer.count(),
      db.customer.count({ where: { createdAt: { gte: monthStart } } }),
      db.customer.count({ where: { createdAt: { gte: prevMonthStart, lt: prevMonthCutoff } } }),
      getProfitEstimate(monthStart, tomorrow),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, orderNumber: true, customerName: true, total: true, paymentStatus: true, status: true, createdAt: true },
      }),
      db.orderEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, type: true, message: true, actor: true, createdAt: true, order: { select: { id: true, orderNumber: true } } },
      }),
    ]);

  const byStatus = Object.fromEntries(statusGroups.map((group) => [group.status, group._count])) as Partial<Record<OrderStatus, number>>;
  const byPayment = Object.fromEntries(paymentGroups.map((group) => [group.paymentStatus, group._count])) as Partial<Record<PaymentStatus, number>>;
  const totalOrders = statusGroups.reduce((sum, group) => sum + group._count, 0);

  return {
    today: todaySales,
    yesterday: yesterdaySales,
    week,
    prevWeek,
    month,
    prevMonth,
    totalOrders,
    pendingPayment: byPayment.PENDING ?? 0,
    paid: byPayment.APPROVED ?? 0,
    toFulfil: (byStatus.CONFIRMED ?? 0) + (byStatus.PROCESSING ?? 0),
    shipped: byStatus.SHIPPED ?? 0,
    delivered: byStatus.DELIVERED ?? 0,
    customers,
    newCustomers,
    prevNewCustomers,
    profit,
    recentOrders,
    recentEvents,
  };
}

// ───────────── Pedidos ─────────────

export const ORDERS_PAGE_SIZE = 25;

export interface OrderFilters {
  q?: string;
  status?: string;
  payment?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
}

export async function listOrders(filters: OrderFilters) {
  const page = Math.max(1, Number(filters.page) || 1);
  const where: Prisma.OrderWhereInput = {};
  const q = filters.q?.trim().slice(0, 120);
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { customerEmail: { contains: q, mode: "insensitive" } },
    ];
  }
  const status = pick(OrderStatus, filters.status);
  const payment = pick(PaymentStatus, filters.payment);
  if (status) where.status = status;
  if (payment) where.paymentStatus = payment;
  const from = parseLocalDate(filters.from);
  const to = parseLocalDate(filters.to);
  if (from || to) where.createdAt = { ...(from && { gte: from }), ...(to && { lt: addDays(to, 1) }) };

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: filters.sort === "asc" ? "asc" : "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        customerName: true,
        customerEmail: true,
        total: true,
        paymentStatus: true,
        status: true,
        paymentMethod: true,
        shippingCity: true,
      },
    }),
  ]);
  return { orders, total, page, pages: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)) };
}

export function getOrder(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
}

// ───────────── Clientes ─────────────

export const CUSTOMERS_PAGE_SIZE = 25;

export async function listCustomers(filters: { q?: string; page?: string }) {
  const page = Math.max(1, Number(filters.page) || 1);
  const q = filters.q?.trim().slice(0, 120);
  const where: Prisma.CustomerWhereInput = q
    ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }
    : {};

  const [total, customers] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * CUSTOMERS_PAGE_SIZE,
      take: CUSTOMERS_PAGE_SIZE,
      select: { id: true, fullName: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
    }),
  ]);

  const ids = customers.map((customer) => customer.id);
  const [paid, last] = await Promise.all([
    db.order.groupBy({ by: ["customerId"], where: { customerId: { in: ids }, ...PAID }, _sum: { total: true } }),
    db.order.groupBy({ by: ["customerId"], where: { customerId: { in: ids } }, _max: { createdAt: true } }),
  ]);
  const spent = new Map(paid.map((row) => [row.customerId, row._sum.total ?? 0]));
  const lastOrder = new Map(last.map((row) => [row.customerId, row._max.createdAt]));

  return {
    customers: customers.map((customer) => ({
      ...customer,
      orders: customer._count.orders,
      totalSpent: spent.get(customer.id) ?? 0,
      lastOrderAt: lastOrder.get(customer.id) ?? null,
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE)),
  };
}

export async function getCustomer(id: string) {
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { updatedAt: "desc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, createdAt: true, total: true, paymentStatus: true, status: true, shippingCity: true },
      },
    },
  });
  if (!customer) return null;
  const paidOrders = customer.orders.filter((order) => order.paymentStatus === "APPROVED");
  const totalSpent = paidOrders.reduce((sum, order) => sum + order.total, 0);
  return {
    customer,
    stats: {
      orders: customer.orders.length,
      paidOrders: paidOrders.length,
      totalSpent,
      avgTicket: paidOrders.length ? Math.round(totalSpent / paidOrders.length) : 0,
      lastPurchase: paidOrders[0]?.createdAt ?? null,
    },
  };
}

// ───────────── Analytics ─────────────

type Bucket = "day" | "week" | "month";

async function salesSeries(unit: Bucket, from: Date, to: Date) {
  const rows = await db.$queryRaw<Array<{ bucket: string; revenue: number; orders: number }>>`
    SELECT to_char(date_trunc(${unit}::text,("paidAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota'), 'YYYY-MM-DD') AS bucket,
           SUM(total)::float8 AS revenue,
           COUNT(*)::int AS orders
    FROM "Order"
    WHERE "paymentStatus" = 'APPROVED' AND "paidAt" >= ${iso(from)}::timestamp AND "paidAt" < ${iso(to)}::timestamp
    GROUP BY 1 ORDER BY 1`;
  const byKey = new Map(rows.map((row) => [row.bucket, row]));

  // Rellena los períodos sin ventas con cero para que el gráfico no tenga huecos.
  const keys: string[] = [];
  const cursor = new Date(`${localDayKey(from)}T00:00:00Z`);
  if (unit === "week") cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 6) % 7));
  if (unit === "month") cursor.setUTCDate(1);
  const end = localDayKey(addDays(to, -1));
  while (cursor.toISOString().slice(0, 10) <= end) {
    keys.push(cursor.toISOString().slice(0, 10));
    if (unit === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (unit === "week") cursor.setUTCDate(cursor.getUTCDate() + 7);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys.map((key) => ({ key, revenue: byKey.get(key)?.revenue ?? 0, orders: byKey.get(key)?.orders ?? 0 }));
}

export const ANALYTICS_RANGES = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 } as const;
export type AnalyticsRange = keyof typeof ANALYTICS_RANGES;

export async function getAnalytics(rangeParam: string | undefined, now = new Date()) {
  const range: AnalyticsRange = rangeParam && rangeParam in ANALYTICS_RANGES ? (rangeParam as AnalyticsRange) : "30d";
  const days = ANALYTICS_RANGES[range];
  const to = addDays(startOfDay(now), 1);
  const from = addDays(to, -days);
  const prevFrom = addDays(from, -days);

  const [summary, prevSummary, daily, weekly, monthly, topProducts, customerMix, profit] = await Promise.all([
    salesBetween(from, to),
    salesBetween(prevFrom, from),
    salesSeries("day", addDays(to, -30), to),
    salesSeries("week", addDays(to, -7 * 12), to),
    salesSeries("month", startOfMonth(now, -11), to),
    db.$queryRaw<Array<{ productId: string | null; name: string; sku: string; units: number; revenue: number }>>`
      SELECT oi."productId", MAX(oi."productName") AS name, oi.sku, SUM(oi.quantity)::int AS units, SUM(oi."totalPrice")::float8 AS revenue
      FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
      WHERE o."paymentStatus" = 'APPROVED' AND o."paidAt" >= ${iso(from)}::timestamp AND o."paidAt" < ${iso(to)}::timestamp
      GROUP BY oi."productId", oi.sku ORDER BY revenue DESC LIMIT 10`,
    db.$queryRaw<Array<{ newCustomers: number; returning: number }>>`
      WITH buyers AS (
        SELECT DISTINCT "customerId" FROM "Order"
        WHERE "paymentStatus" = 'APPROVED' AND "paidAt" >= ${iso(from)}::timestamp AND "paidAt" < ${iso(to)}::timestamp
      ), earlier AS (
        SELECT DISTINCT "customerId" FROM "Order"
        WHERE "paymentStatus" = 'APPROVED' AND "paidAt" < ${iso(from)}::timestamp
      )
      SELECT COUNT(*) FILTER (WHERE e."customerId" IS NULL)::int AS "newCustomers",
             COUNT(*) FILTER (WHERE e."customerId" IS NOT NULL)::int AS returning
      FROM buyers b LEFT JOIN earlier e ON e."customerId" = b."customerId"`,
    getProfitEstimate(from, to),
  ]);

  return { range, days, summary, prevSummary, daily, weekly, monthly, topProducts, customers: customerMix[0] ?? { newCustomers: 0, returning: 0 }, profit };
}

// ───────────── Productos ─────────────

export const PRODUCTS_PAGE_SIZE = 50;

export async function listProducts(filters: { q?: string; status?: string; category?: string; page?: string }) {
  const page = Math.max(1, Number(filters.page) || 1);
  const where: Prisma.ProductWhereInput = {};
  const q = filters.q?.trim().slice(0, 120);
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { brand: { contains: q, mode: "insensitive" } }];
  if (filters.status === "active") where.active = true;
  if (filters.status === "inactive") where.active = false;
  if (filters.status === "no-cost") where.costPrice = null;
  if (filters.status === "low-stock") where.stock = { lte: 5 };
  if (filters.category) where.category = filters.category.slice(0, 80);

  const [total, products, categories, summary, withCost, tracked] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ active: "desc" }, { name: "asc" }],
      skip: (page - 1) * PRODUCTS_PAGE_SIZE,
      take: PRODUCTS_PAGE_SIZE,
      include: { supplier: { select: { name: true } } },
    }),
    db.product.findMany({ distinct: ["category"], select: { category: true }, where: { category: { not: null } }, orderBy: { category: "asc" } }),
    db.product.groupBy({ by: ["active"], _count: true }),
    db.product.count({ where: { costPrice: { not: null } } }),
    db.product.count({ where: { stock: { not: null } } }),
  ]);

  const sales = await db.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map((product) => product.id) }, order: PAID },
    _sum: { quantity: true, totalPrice: true },
  });
  const salesById = new Map(sales.map((row) => [row.productId, row._sum]));

  return {
    products: products.map((product) => ({
      ...product,
      unitsSold: salesById.get(product.id)?.quantity ?? 0,
      revenue: salesById.get(product.id)?.totalPrice ?? 0,
      margin: product.costPrice !== null && product.price > 0 ? (product.price - product.costPrice) / product.price : null,
    })),
    categories: categories.map((row) => row.category!).filter(Boolean),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)),
    summary: {
      active: summary.find((row) => row.active)?._count ?? 0,
      inactive: summary.find((row) => !row.active)?._count ?? 0,
      withCost,
      tracked,
    },
  };
}
