import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/components/admin/format";
import { TeamReviewForm } from "@/components/admin/TeamReviewForm";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { deleteReviewAction, setReviewStatusAction } from "@/server/admin/review-actions";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Reseñas" };

const TABS = [
  { key: "pendientes", status: "PENDING", label: "Pendientes" },
  { key: "publicadas", status: "APPROVED", label: "Publicadas" },
  { key: "rechazadas", status: "REJECTED", label: "Rechazadas" },
] as const;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminReviewsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const raw = await searchParams;
  const tab = TABS.find((item) => item.key === raw.estado) ?? TABS[0];

  const [reviews, counts, products] = await Promise.all([
    db.review.findMany({
      where: { status: tab.status },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { order: { select: { id: true, orderNumber: true } } },
    }),
    db.review.groupBy({ by: ["status"], _count: true }),
    db.product.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const count = (status: string) => counts.find((item) => item.status === status)?._count ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="WOLFEX® ADMIN / 05 — RESEÑAS"
        title="Reseñas"
        description="Los clientes dejan su reseña al confirmar un pedido pagado. Apruébala para que salga en el carrusel del inicio."
      />

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Estado de las reseñas">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/admin/reviews?estado=${item.key}`}
            aria-current={item.key === tab.key ? "page" : undefined}
            className={cn("border px-4 py-2 type-label transition-colors", item.key === tab.key ? "border-arc bg-arc/10 text-bone" : "border-line-strong text-steel hover:text-bone")}
          >
            {item.label} <span className="ml-1 font-mono text-arc">{count(item.status)}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-3">
        {reviews.length === 0 ? (
          <EmptyState title={`No hay reseñas ${tab.label.toLowerCase()}`} description={tab.status === "PENDING" ? "Cuando un cliente deje una reseña desde su pedido, aparecerá aquí para que la revises." : undefined} />
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-sm border border-line-strong bg-ink/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-arc">{"★".repeat(review.rating)}<span className="text-line-strong">{"★".repeat(5 - review.rating)}</span></p>
                  <p className="mt-1 type-title text-sm text-bone">
                    {review.authorName}
                    {review.city && <span className="text-steel"> · {review.city}</span>}
                  </p>
                  <p className="mt-1 text-xs text-steel">
                    {formatDate(review.createdAt)}
                    {review.productName && ` · ${review.productName}`}
                    {review.order && (
                      <>
                        {" · "}
                        <Link href={`/admin/orders/${review.order.id}`} className="text-arc hover:underline">
                          {review.order.orderNumber}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                {review.source === "CUSTOMER" ? <Badge tone="good">Compra verificada</Badge> : <Badge>{review.label ?? "Equipo"}</Badge>}
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-bone/90">{review.body}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {review.status !== "APPROVED" && <StatusButton id={review.id} status="APPROVED" label="Publicar" primary />}
                {review.status !== "REJECTED" && <StatusButton id={review.id} status="REJECTED" label={review.status === "APPROVED" ? "Ocultar" : "Rechazar"} />}
                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <button className="border border-red-400/30 px-3 py-2 type-label text-red-300 transition-colors hover:bg-red-400/10">Eliminar</button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>

      <Panel title="Cargar reseña del equipo" className="mt-10">
        <TeamReviewForm products={products} />
      </Panel>
    </>
  );
}

function StatusButton({ id, status, label, primary = false }: { id: string; status: "APPROVED" | "REJECTED"; label: string; primary?: boolean }) {
  return (
    <form action={setReviewStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={cn("border px-3 py-2 type-label transition-colors", primary ? "border-arc bg-volt text-bone hover:bg-arc hover:text-void" : "border-line-strong text-steel hover:text-bone")}>{label}</button>
    </form>
  );
}
