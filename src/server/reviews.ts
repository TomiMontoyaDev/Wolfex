import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "./db";

export const REVIEWS_TAG = "reviews";

/** Lo que ve la tienda de cada reseña aprobada (sin datos de contacto ni del pedido). */
export interface PublicReview {
  id: string;
  authorName: string;
  city: string | null;
  rating: number;
  body: string;
  productName: string | null;
  /** true = la dejó un cliente desde un pedido pagado. */
  verified: boolean;
  /** Para reseñas del equipo: relación con la marca ("Equipo WOLFEX"). */
  label: string | null;
}

/** "Samuel Arturo Alvarez" → "Samuel A.": nombre público sin exponer el nombre completo del cliente. */
export function publicAuthorName(fullName: string) {
  const [first = "Cliente", ...rest] = fullName.trim().split(/\s+/);
  const initial = rest.at(-2)?.[0] ?? rest.at(-1)?.[0];
  const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return initial ? `${cap(first)} ${initial.toUpperCase()}.` : cap(first);
}

export const getPublishedReviews = unstable_cache(
  async (): Promise<PublicReview[]> => {
    const reviews = await db.review.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
      take: 30,
      select: { id: true, authorName: true, city: true, rating: true, body: true, productName: true, source: true, label: true },
    });
    return reviews.map(({ source, ...review }) => ({ ...review, verified: source === "CUSTOMER", label: source === "TEAM" ? review.label : null }));
  },
  ["published-reviews", "v1"],
  { tags: [REVIEWS_TAG], revalidate: 3600 },
);
