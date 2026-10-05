"use server";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { publicAuthorName } from "./reviews";

export interface ReviewFormState {
  ok?: boolean;
  error?: string;
}

const reviewSchema = z.object({
  orderRef: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Elige de 1 a 5 estrellas.").max(5),
  body: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres).").max(600, "Máximo 600 caracteres."),
  productId: z.string().max(120).optional(),
});

/**
 * Reseña del cliente desde la confirmación de su pedido. Solo pedidos PAGADOS y una por pedido.
 * Queda pendiente: se publica cuando el admin la aprueba.
 */
export async function submitReviewAction(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const parsed = reviewSchema.safeParse({
    orderRef: formData.get("orderRef"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    productId: formData.get("productId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa tu reseña." };
  const { orderRef, rating, body, productId } = parsed.data;

  try {
    const order = await db.order.findUnique({
      where: { externalReference: orderRef },
      select: { id: true, paymentStatus: true, customerName: true, shippingCity: true, items: { select: { productId: true, productName: true } } },
    });
    if (!order || order.paymentStatus !== "APPROVED") return { error: "Solo se pueden reseñar pedidos pagados." };

    // El producto debe ser uno del pedido; si no eligió, se toma el primero.
    const item = order.items.find((line) => line.productId && line.productId === productId) ?? order.items[0];
    await db.review.create({
      data: {
        authorName: publicAuthorName(order.customerName),
        city: order.shippingCity,
        rating,
        body,
        source: "CUSTOMER",
        status: "PENDING",
        productId: item?.productId ?? null,
        productName: item?.productName ?? null,
        orderId: order.id,
      },
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Ya dejaste una reseña para este pedido. ¡Gracias!" };
    console.error("[reviews] no se pudo guardar la reseña", error);
    return { error: "No pudimos guardar tu reseña. Intenta de nuevo." };
  }
}
