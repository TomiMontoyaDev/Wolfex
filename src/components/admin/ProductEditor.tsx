"use client";

import { useActionState } from "react";
import { updateProductAction, type ActionState } from "@/server/admin/actions";
import { inputClass } from "./ui";

/** Edición rápida de costo, stock y estado. El precio viene del catálogo (db:sync-catalog). */
export function ProductEditor({ productId, costPrice, stock, active }: { productId: string; costPrice: number | null; stock: number | null; active: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProductAction, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="productId" value={productId} />
      <label className="block w-32">
        <span className="type-label text-steel">Costo</span>
        <input name="costPrice" defaultValue={costPrice ?? ""} inputMode="numeric" placeholder="—" className={`mt-1.5 ${inputClass} h-9`} />
      </label>
      <label className="block w-24">
        <span className="type-label text-steel">Stock</span>
        <input name="stock" defaultValue={stock ?? ""} inputMode="numeric" placeholder="Sin control" className={`mt-1.5 ${inputClass} h-9`} />
      </label>
      <label className="flex h-9 items-center gap-2 type-label text-steel">
        <input type="checkbox" name="active" defaultChecked={active} className="h-4 w-4 accent-[#0066ff]" />
        Activo
      </label>
      <button disabled={pending} className="h-9 border border-line-strong px-4 type-label transition-colors hover:border-arc hover:text-arc disabled:opacity-50">
        {pending ? "…" : "Guardar"}
      </button>
      {state.error && <span role="alert" className="type-label text-red-300">{state.error}</span>}
      {state.ok && <span role="status" className="type-label text-emerald-300">{state.message}</span>}
    </form>
  );
}
