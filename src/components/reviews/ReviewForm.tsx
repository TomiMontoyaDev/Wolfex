"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { submitReviewAction, type ReviewFormState } from "@/server/review-actions";
import { cn } from "@/lib/utils";

/** Reseña del cliente en la confirmación del pedido (pedido pagado). Se publica cuando el admin la aprueba. */
export function ReviewForm({ orderRef, products }: { orderRef: string; products: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReviewAction, {});
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.ok) {
    return (
      <div role="status" className="mt-12 w-full max-w-lg border border-arc/40 bg-arc/5 p-6 text-left">
        <p className="type-title text-bone">¡Gracias por tu reseña!</p>
        <p className="mt-2 text-sm text-steel">La revisamos y la publicamos en la tienda en poco tiempo.</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-12 w-full max-w-lg border border-line-strong bg-ink/70 p-6 text-left">
      <input type="hidden" name="orderRef" value={orderRef} />
      <input type="hidden" name="rating" value={rating || ""} />
      <p className="type-title text-bone">¿Qué tal tu compra?</p>
      <p className="mt-1 text-sm text-steel">Tu opinión ayuda a otros a elegir. Saldrá con tu nombre y la inicial de tu apellido.</p>

      <fieldset className="mt-5">
        <legend className="type-label text-steel">Calificación</legend>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
              aria-pressed={rating === value}
              className="p-1"
            >
              <Star className={cn("h-7 w-7 transition-colors", value <= (hover || rating) ? "fill-arc text-arc" : "text-line-strong")} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </fieldset>

      {products.length > 1 && (
        <label className="mt-5 block">
          <span className="type-label text-steel">Producto</span>
          <select name="productId" className="mt-2 h-12 w-full rounded-sm border border-line-strong bg-void px-3 text-sm text-bone outline-none focus:border-arc">
            {products.map((product) => (
              <option key={product.id} value={product.id} className="bg-ink">
                {product.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {products.length === 1 && <input type="hidden" name="productId" value={products[0].id} />}

      <label className="mt-5 block">
        <span className="type-label text-steel">Tu reseña</span>
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={600}
          rows={4}
          placeholder="¿Cómo te fue con el producto? ¿Lo recomendarías?"
          className="mt-2 w-full rounded-sm border border-line-strong bg-void px-4 py-3 text-sm text-bone outline-none placeholder:text-steel/60 focus:border-arc"
        />
      </label>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <button
        disabled={pending || !rating}
        className="mt-5 h-12 w-full bg-volt type-title text-xs text-bone transition-opacity hover:bg-arc hover:text-void disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Enviando…" : rating ? "Enviar reseña" : "Elige tus estrellas"}
      </button>
    </form>
  );
}
