import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { PICKUP_CITY } from "@/config/payments";
import { quoteShipping } from "@/config/shipping";
import { Prisma } from "@/generated/prisma/client";
import { productWeightKg } from "@/lib/weight";
import { computeCombo } from "./combo";
import { db } from "./db";
import { mpPreferences } from "./mercadopago";
import type { OrderTracking } from "./meta-purchase";
import type { CheckoutInput } from "./validation";

/** Error con mensaje seguro para mostrar al cliente. */
export class CheckoutError extends Error {}

const ORDER_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin 0/O ni 1/I

export function generateOrderNumber(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const code = Array.from({ length: 5 }, () => ORDER_CODE_ALPHABET[randomInt(ORDER_CODE_ALPHABET.length)]).join("");
  return `WFX-${date}-${code}`;
}

const normalizeCity = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

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
export async function createOrder(input: CheckoutInput, idempotencyKey?: string, tracking?: OrderTracking) {
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
    if (product.soldOut) throw new CheckoutError(`${product.name} está agotado.`);
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
      unitDiscount: 0,
    };
  });

  // Descuento por combo: lo calcula el servidor con los precios y costos de la base (tope de margen por producto).
  const combo = await computeCombo(items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
  for (const item of items) Object.assign(item, { unitDiscount: combo.unitDiscounts.get(item.productId) ?? 0 });

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discount = combo.discount;
  const tax = 0; // Precios con IVA incluido.
  const { customer, paymentMethod } = input;

  // Envío: lo calcula y lo cobra el servidor (tarifa por zona + recargo por peso). Recoger en Pereira = sin envío.
  if (paymentMethod === "PICKUP" && !(customer.city && normalizeCity(customer.city) === normalizeCity(PICKUP_CITY))) {
    throw new CheckoutError(`La opción de recoger solo está disponible en ${PICKUP_CITY}.`);
  }
  const weightKg = items.reduce((sum, item) => sum + productWeightKg(byId.get(item.productId)!) * item.quantity, 0);
  const shipping = quoteShipping({ subtotal: subtotal - discount, weightKg, city: customer.city, department: customer.department });
  if (paymentMethod !== "PICKUP" && shipping.cost === null) {
    throw new CheckoutError("El envío a tu departamento se cotiza por WhatsApp: escríbenos y te ayudamos a terminar la compra.");
  }
  const shippingCost = paymentMethod === "PICKUP" ? 0 : (shipping.cost ?? 0);
  const total = subtotal - discount + shippingCost + tax;
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
          address: customer.address || `Recoge en ${PICKUP_CITY}`,
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
            shippingCost,
            // Mercado Pago (pago en línea) · TRANSFER y PICKUP quedan pendientes de pago hasta que el admin los marque pagados.
            paymentProvider: paymentMethod,
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
            ...(tracking && { tracking: JSON.parse(JSON.stringify(tracking)) }),
            // Solicitud de factura electrónica: queda "pendiente" para gestionarla en /admin/facturas.
            ...(input.invoice && {
              requiresInvoice: true,
              invoiceStatus: "PENDIENTE" as const,
              invoiceRequest: { create: input.invoice },
            }),
            items: { create: items },
            events: { create: { type: "ORDER_CREATED", actor: "checkout", metadata: { items: items.length, total, paymentMethod, shippingCost, weightKg: Math.round(weightKg * 100) / 100, ...(discount && { comboDiscount: discount, comboPercent: combo.percent }) } } },
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
  if (order.paymentProvider !== "MERCADOPAGO") throw new CheckoutError("Este pedido se paga por transferencia o al recoger.");
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
        items: [
          ...items.map((item) => ({
          id: item.sku,
          title: item.variant ? `${item.productName} · ${item.variant}` : item.productName,
          description: item.productName,
          // Mercado Pago no tiene categoría de suplementos: "others" es la que corresponde (GET /item_categories).
          category_id: "others",
          quantity: item.quantity,
          // Precio con el descuento de combo por unidad: la suma de ítems es exactamente order.total.
          unit_price: item.unitPrice - item.unitDiscount,
          currency_id: order.currency,
          })),
          // El envío va como ítem: así lo cobrado por Mercado Pago es exactamente order.total (el webhook lo compara).
          ...(order.shippingCost > 0
            ? [{ id: "ENVIO", title: "Envío", description: "Envío del pedido", category_id: "others", quantity: 1, unit_price: order.shippingCost, currency_id: order.currency }]
            : []),
        ],
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
