"use client";

import { useActionState } from "react";
import type { ActionState } from "@/server/admin/actions";
import { quickUpdateProductAction } from "@/server/admin/product-actions";
import { inputClass } from "./ui";

/** Edición rápida desde la lista: precio, costo, stock y estado. Lo demás se edita en la ficha del producto. */
export function ProductEditor({
  productId,
  price,
  costPrice,
  stock,
  active,
}: {
  productId: string;
  price: number;
  costPrice: number | null;
  stock: number | null;
  active: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(quickUpdateProductAction, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="productId" value={productId} />
      <label className="block w-28">
        <span className="type-label text-steel">Precio</span>
        <input name="price" required defaultValue={price} inputMode="numeric" className={`mt-1.5 ${inputClass} h-9`} />
      </label>
      <label className="block w-28">
        <span className="type-label text-steel">Costo</span>
        <input name="costPrice" defaultValue={costPrice ?? ""} inputMode="numeric" placeholder="—" className={`mt-1.5 ${inputClass} h-9`} />
      </label>
      <label className="block w-24">
        <span className="type-label text-steel">Stock</span>
        <input name="stock" defaultValue={stock ?? ""} inputMode="numeric" placeholder="Sin control" className={`mt-1.5 ${inputClass} h-9`} />
      </label>
      <label className="flex h-9 items-center gap-2 type-label text-steel">
        <input type="checkbox" name="active" defaultChecked={active} className="h-4 w-4 accent-[#0066ff]" />
        Visible
      </label>
      <button disabled={pending} className="h-9 border border-line-strong px-4 type-label transition-colors hover:border-arc hover:text-arc disabled:opacity-50">
        {pending ? "…" : "Guardar"}
      </button>
      {state.error && <span role="alert" className="type-label text-red-300">{state.error}</span>}
      {state.ok && <span role="status" className="type-label text-emerald-300">{state.message}</span>}
    </form>
  );
}
