"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "../auth";
import { db } from "../db";
import { REVIEWS_TAG } from "../reviews";
import type { ActionState } from "./actions";

function refresh() {
  updateTag(REVIEWS_TAG);
  revalidatePath("/");
  revalidatePath("/admin/reviews");
}

const statusSchema = z.object({ id: z.string().min(1), status: z.enum(["APPROVED", "REJECTED", "PENDING"]) });

export async function setReviewStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = statusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  const { id, status } = parsed.data;
  await db.review.update({ where: { id }, data: { status, approvedAt: status === "APPROVED" ? new Date() : null } });
  refresh();
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.review.delete({ where: { id } }).catch(() => null);
  refresh();
}

const teamSchema = z.object({
  authorName: z.string().trim().min(2, "Escribe el nombre.").max(60),
  label: z.string().trim().min(2, "Indica la relación con la marca (ej. Equipo WOLFEX, Amigo de la marca).").max(40),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10, "La reseña es muy corta.").max(600),
  productId: z.string().max(120).optional(),
});

/**
 * Reseña cargada a mano (equipo, amigos que probaron el producto). Se publica con su relación visible
 * y SIN el sello "Compra verificada": solo las reseñas de pedidos pagados lo llevan.
 */
export async function createTeamReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = teamSchema.safeParse({
    authorName: formData.get("authorName"),
    label: formData.get("label"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    productId: formData.get("productId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { productId, ...data } = parsed.data;
  const product = productId ? await db.product.findUnique({ where: { id: productId }, select: { id: true, name: true } }) : null;
  await db.review.create({
    data: { ...data, source: "TEAM", status: "APPROVED", approvedAt: new Date(), productId: product?.id ?? null, productName: product?.name ?? null },
  });
  refresh();
  return { ok: true, message: "Reseña publicada." };
}
