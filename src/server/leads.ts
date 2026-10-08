import "server-only";
import { z } from "zod";
import { COLOMBIA } from "@/data/colombia";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";

/**
 * Posibles clientes: lo que la persona escribe en el checkout ANTES de pagar se guarda como cliente
 * del panel (marcado isLead) junto con su carrito. Si después compra con el mismo correo,
 * el pedido usa ese mismo cliente (upsert por correo en createOrder) y deja de contarse como posible cliente.
 */

export const leadSchema = z
  .object({
    token: z.string().uuid(),
    name: z.string().trim().max(120).default(""),
    email: z
      .string()
      .trim()
      .max(160)
      .default("")
      .transform((value) => value.toLowerCase())
      .pipe(z.union([z.literal(""), z.email()])),
    phone: z.string().trim().max(40).default(""),
    department: z.string().trim().max(80).default(""),
    city: z.string().trim().max(80).default(""),
    address: z.string().trim().max(240).default(""),
    lines: z.array(z.object({ productId: z.string().min(1).max(160), quantity: z.number().int().min(1).max(99) })).max(50),
  })
  .refine((lead) => lead.email || lead.phone.replace(/\D/g, "").length >= 7, "Falta un correo o un teléfono válido.");

export type LeadInput = z.infer<typeof leadSchema>;

export interface LeadCartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface LeadCart {
  items: LeadCartItem[];
  total: number;
}

/** Lee el carrito guardado (JSON) con tolerancia a datos viejos o incompletos. */
export function readLeadCart(value: unknown): LeadCart | null {
  if (!value || typeof value !== "object" || !Array.isArray((value as LeadCart).items)) return null;
  const cart = value as LeadCart;
  return { items: cart.items, total: Number(cart.total) || 0 };
}

const splitName =(fullName: string) => {
  const [firstName = "Posible", ...rest] = fullName.split(/\s+/);
  return { firstName, lastName: rest.join(" ") || null };
};

export async function saveLead(input: LeadInput) {
  // Carrito con nombres y precios de la base (nunca los del navegador).
  const ids = [...new Set(input.lines.map((line) => line.productId))];
  const products = ids.length ? await db.product.findMany({ where: { id: { in: ids } }, select: { id: true, sku: true, name: true, price: true } }) : [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const items: LeadCartItem[] = input.lines.flatMap((line) => {
    const product = byId.get(line.productId);
    return product ? [{ productId: product.id, sku: product.sku, name: product.name, price: product.price, quantity: line.quantity }] : [];
  });
  const cart: LeadCart = { items, total: items.reduce((sum, item) => sum + item.price * item.quantity, 0) };
  const leadCart = cart as unknown as Prisma.InputJsonObject;
  const now = new Date();
  const department = input.department && Object.hasOwn(COLOMBIA, input.department) ? input.department : "";

  let mine = await db.customer.findUnique({ where: { leadToken: input.token }, select: { id: true, email: true, _count: { select: { orders: true } } } });
  // Si ese cliente ya hizo pedidos, sus datos no se tocan desde el checkout: se suelta el token y se sigue como nuevo.
  if (mine && mine._count.orders > 0) {
    await db.customer.update({ where: { id: mine.id }, data: { leadToken: null } });
    mine = null;
  }
  const owner = input.email ? await db.customer.findUnique({ where: { email: input.email }, select: { id: true, phone: true } }) : null;

  // El correo ya es de otro cliente (p. ej. alguien que ya compró): solo se le anota el carrito y se completa
  // el teléfono si no tenía; no se le cambian nombre ni datos (el checkout es público).
  if (owner && owner.id !== mine?.id) {
    await db.customer.update({
      where: { id: owner.id },
      data: { leadCart, leadUpdatedAt: now, ...(!owner.phone && input.phone && { phone: input.phone }) },
    });
    // El posible cliente sin correo creado antes por este navegador se fusiona en el existente.
    if (mine && !mine.email && mine._count.orders === 0) await db.customer.delete({ where: { id: mine.id } }).catch(() => null);
    return owner.id;
  }

  const data = {
    ...(input.name && { fullName: input.name, ...splitName(input.name) }),
    ...(input.email && { email: input.email }),
    ...(input.phone && { phone: input.phone }),
    leadCart,
    leadUpdatedAt: now,
  };
  const customer = mine
    ? await db.customer.update({ where: { id: mine.id }, data })
    : await db.customer.create({
        data: { fullName: input.name || "Posible cliente", ...splitName(input.name || "Posible cliente"), isLead: true, leadToken: input.token, ...data },
      });

  // Dirección: se guarda o actualiza la más reciente del posible cliente.
  if (department || input.city || input.address) {
    const address = { department: department || null, city: input.city || null, address: input.address, recipientName: input.name || null, recipientPhone: input.phone || null };
    const latest = await db.address.findFirst({ where: { customerId: customer.id }, orderBy: { updatedAt: "desc" }, select: { id: true } });
    if (latest) await db.address.update({ where: { id: latest.id }, data: address });
    else await db.address.create({ data: { customerId: customer.id, ...address } });
  }
  return customer.id;
}
