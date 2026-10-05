import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { mpPreferences } from "./mercadopago";
import type { CheckoutInput } from "./validation";

/** Error con mensaje seguro para mostrar al cliente. */
export class CheckoutError extends Error {}

// No se cobra en línea: desde los mínimos de src/config/shipping.ts es gratis y por debajo se cobra aparte según producto y localidad.
const SHIPPING_COST = 0;
const ORDER_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin 0/O ni 1/I

function generateOrderNumber(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const code = Array.from({ length: 5 }, () => ORDER_CODE_ALPHABET[randomInt(ORDER_CODE_ALPHABET.length)]).join("");
  return `WFX-${date}-${code}`;
}

function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.split(" ");
  return { firstName, lastName: rest.join(" ") || null };
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Agrupa líneas repetidas (mismo producto y variante) para validar stock sobre el total real. */
function mergeLines(lines: CheckoutInput["lines"]) {
  const merged = new Map<string, { productId: string; variant: string | null; quantity: number }>();
  for (const line of lines) {
    const variant = line.color?.trim() || null;
    const key = `${line.productId}::${variant ?? ""}`;
    const current = merged.get(key);
    if (current) current.quantity += line.quantity;
    else merged.set(key, { productId: line.productId, variant, quantity: line.quantity });
  }
  return [...merged.values()];
}

/**
 * Crea Customer + Address + Order + OrderItems en una sola transacción.
 * Los precios salen SIEMPRE de la base de datos, nunca del navegador.
 * Con la misma idempotencyKey devuelve la orden ya creada en vez de duplicarla.
 */
export async function createOrder(input: CheckoutInput, idempotencyKey?: string) {
  if (idempotencyKey) {
    const existing = await db.order.findUnique({ where: { idempotencyKey } });
    if (existing) return { order: existing, reused: true };
  }

  const lines = mergeLines(input.lines);
  const products = await db.product.findMany({ where: { id: { in: [...new Set(lines.map((line) => line.productId))] } } });
  const byId = new Map(products.map((product) => [product.id, product]));

  const quantityByProduct = new Map<string, number>();
  for (const line of lines) quantityByProduct.set(line.productId, (quantityByProduct.get(line.productId) ?? 0) + line.quantity);

  const items = lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product || !product.active) throw new CheckoutError("Uno de los productos ya no está disponible.");
    if (product.stock !== null && (quantityByProduct.get(product.id) ?? 0) > product.stock) {
      throw new CheckoutError(`No hay suficiente stock de ${product.name}.`);
    }
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      variant: line.variant,
      quantity: line.quantity,
      unitPrice: product.price,
      totalPrice: product.price * line.quantity,
      unitCost: product.costPrice,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discount = 0;
  const tax = 0; // Precios con IVA incluido.
  const total = subtotal - discount + SHIPPING_COST + tax;
  const { customer } = input;
  const { firstName, lastName } = splitName(customer.name);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await db.$transaction(async (tx) => {
        const savedCustomer = await tx.customer.upsert({
          where: { email: customer.email },
          create: { email: customer.email, fullName: customer.name, firstName, lastName, phone: customer.phone },
          update: { fullName: customer.name, firstName, lastName, phone: customer.phone },
        });

        const addressData = {
          country: "CO",
          department: customer.department ?? null,
          city: customer.city ?? null,
          neighborhood: customer.neighborhood ?? null,
          address: customer.address,
          addressComplement: customer.addressComplement ?? null,
          postalCode: customer.postalCode ?? null,
          recipientName: customer.recipientName ?? null,
          recipientPhone: customer.recipientPhone ?? null,
        };
        // Reutiliza la dirección si el cliente ya la había usado; si no, crea una nueva.
        const address =
          (await tx.address.findFirst({ where: { customerId: savedCustomer.id, ...addressData } })) ??
          (await tx.address.create({ data: { customerId: savedCustomer.id, ...addressData } }));

        return tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            externalReference: randomUUID(),
            idempotencyKey,
            customerId: savedCustomer.id,
            addressId: address.id,
            subtotal,
            shippingCost: SHIPPING_COST,
            discount,
            tax,
            total,
            currency: "COP",
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            shippingCountry: addressData.country,
            shippingDepartment: addressData.department,
            shippingCity: addressData.city,
            shippingNeighborhood: addressData.neighborhood,
            shippingAddress: addressData.address,
            shippingComplement: addressData.addressComplement,
            shippingPostalCode: addressData.postalCode,
            recipientName: addressData.recipientName ?? customer.name,
            recipientPhone: addressData.recipientPhone ?? customer.phone,
            customerNotes: customer.notes,
            // Solicitud de factura electrónica: queda "pendiente" para gestionarla en /admin/facturas.
            ...(input.invoice && {
              requiresInvoice: true,
              invoiceStatus: "PENDIENTE" as const,
              invoiceRequest: { create: input.invoice },
            }),
            items: { create: items },
            events: { create: { type: "ORDER_CREATED", actor: "checkout", metadata: { items: items.length, total } } },
          },
        });
      });
      return { order, reused: false };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Doble envío simultáneo con la misma clave: devolver la orden que ganó la carrera.
      if (idempotencyKey) {
        const existing = await db.order.findUnique({ where: { idempotencyKey } });
        if (existing) return { order: existing, reused: true };
      }
      // Si no, fue una colisión de orderNumber: reintentar con otro número.
    }
  }
  throw new Error("No fue posible generar un número de pedido único.");
}

type OrderForCheckout = Awaited<ReturnType<typeof createOrder>>["order"];

/** Crea (o reutiliza) la preferencia de Checkout Pro para una orden y devuelve la URL de pago. */
export async function createMercadoPagoCheckout(order: OrderForCheckout, baseUrl: string) {
  if (order.paymentStatus === "APPROVED") throw new CheckoutError("Este pedido ya fue pagado.");
  if (order.checkoutUrl) return order.checkoutUrl;

  const items = await db.orderItem.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "asc" } });
  const isPublic = baseUrl.startsWith("https://");
  const resultUrl = `${baseUrl}/payment/result`;

  // Datos del comprador completos ayudan al antifraude de Mercado Pago a aprobar el pago.
  const { firstName, lastName } = splitName(order.customerName);
  const phoneDigits = order.customerPhone?.replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "");

  try {
    const preference = await mpPreferences().create({
      body: {
        items: items.map((item) => ({
          id: item.sku,
          title: item.variant ? `${item.productName} · ${item.variant}` : item.productName,
          description: item.productName,
          // Mercado Pago no tiene categoría de suplementos: "others" es la que corresponde (GET /item_categories).
          category_id: "others",
          quantity: item.quantity,
          unit_price: item.unitPrice,
          currency_id: order.currency,
        })),
        ...(order.shippingCost > 0 && { shipments: { cost: order.shippingCost, mode: "not_specified" } }),
        payer: {
          name: firstName,
          ...(lastName && { surname: lastName }),
          email: order.customerEmail,
          ...(phoneDigits && { phone: { area_code: "57", number: phoneDigits } }),
          address: { street_name: order.shippingAddress },
        },
        external_reference: order.externalReference,
        statement_descriptor: "WOLFEX",
        // Mercado Pago solo acepta back_urls / notification_url públicas con HTTPS: con una URL local
        // (http://localhost) no se envían, para no romper el checkout al probar en desarrollo.
        ...(isPublic && {
          back_urls: { success: resultUrl, pending: resultUrl, failure: resultUrl },
          auto_return: "approved",
          notification_url: `${baseUrl}/api/mercadopago/webhook`,
        }),
        metadata: { order_id: order.id, order_number: order.orderNumber },
      },
      requestOptions: { idempotencyKey: `pref-${order.id}` },
    });
    if (!preference.id || !preference.init_point) throw new Error("Mercado Pago no devolvió el enlace de pago.");

    await db.order.update({
      where: { id: order.id },
      data: {
        mpPreferenceId: preference.id,
        checkoutUrl: preference.init_point,
        events: { create: { type: "CHECKOUT_CREATED", actor: "checkout", metadata: { preferenceId: preference.id } } },
      },
    });
    return preference.init_point;
  } catch (error) {
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        type: "CHECKOUT_FAILED",
        actor: "checkout",
        message: error instanceof Error ? error.message.slice(0, 500) : "Error desconocido",
      },
    });
    throw error;
  }
}
