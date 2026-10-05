"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionState } from "@/server/admin/actions";
import { createTeamReviewAction } from "@/server/admin/review-actions";
import { buttonClass, inputClass } from "./ui";

/** Reseña cargada a mano: equipo o conocidos que REALMENTE probaron el producto, con su relación visible. */
export function TeamReviewForm({ products }: { products: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createTeamReviewAction, {});
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  const field = "mt-2 " + inputClass;
  return (
    <form ref={form} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="type-label text-steel">Nombre que se muestra *</span>
          <input name="authorName" required maxLength={60} placeholder="Ej. Tomi y Nicole" className={field} />
        </label>
        <label className="block">
          <span className="type-label text-steel">Relación con la marca *</span>
          <input name="label" required maxLength={40} defaultValue="Equipo WOLFEX" className={field} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <label className="block">
          <span className="type-label text-steel">Producto</span>
          <select name="productId" defaultValue="" className={`${field} appearance-none`}>
            <option value="">Sin producto específico</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="type-label text-steel">Estrellas *</span>
          <select name="rating" defaultValue="5" className={`${field} appearance-none`}>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="type-label text-steel">Reseña *</span>
        <textarea name="body" required minLength={10} maxLength={600} rows={4} placeholder="La opinión real, en palabras de quien probó el producto." className={`${field} h-auto py-3`} />
      </label>
      <p className="text-xs text-steel">
        Se publica de inmediato con la relación visible (por ejemplo, “Equipo WOLFEX”) y sin el sello “Compra verificada”, que solo llevan las reseñas de pedidos pagados. Usa solo opiniones reales: las reseñas falsas son publicidad engañosa (Ley 1480).
      </p>
      {state.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-300">{state.message}</p>}
      <button disabled={pending} className={buttonClass}>
        {pending ? "Publicando…" : "Publicar reseña"}
      </button>
    </form>
  );
}
