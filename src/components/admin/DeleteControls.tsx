"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "@/server/admin/actions";
import { ghostButtonClass } from "./ui";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const dangerButton =
  "inline-flex h-11 items-center justify-center gap-2 border border-red-400/60 bg-red-500/20 px-5 type-label text-red-100 transition-colors hover:bg-red-500/30 disabled:pointer-events-none disabled:opacity-50";

/** Botón destructivo con confirmación en dos pasos. */
export function DangerAction({
  action,
  fields,
  label,
  title,
  description,
  confirmLabel,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  title: string;
  description?: string;
  confirmLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 type-label text-red-300/80 transition-colors hover:text-red-300">
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        {label}
      </button>
    );
  }
  return (
    <form action={formAction} className="space-y-3 rounded-sm border border-red-400/30 bg-red-400/5 p-4">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <p className="text-sm text-bone">{title}</p>
      {description && <p className="text-sm text-steel">{description}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} className={dangerButton}>
          {pending ? "Eliminando…" : confirmLabel}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className={ghostButtonClass}>
          Cancelar
        </button>
      </div>
      {state.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
    </form>
  );
}

/** Casilla de cada fila; se asocia al formulario de borrado masivo (`formId`) por el atributo `form`. */
export function RowCheckbox({ id, label, formId }: { id: string; label: string; formId: string }) {
  return <input type="checkbox" name="ids" value={id} form={formId} aria-label={label} className="h-4 w-4 cursor-pointer accent-[#0066ff]" />;
}

export function SelectAllCheckbox({ formId, label }: { formId: string; label: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      className="h-4 w-4 cursor-pointer accent-[#0066ff]"
      onChange={(event) => {
        document.querySelectorAll<HTMLInputElement>(`input[form="${formId}"][name="ids"]`).forEach((box) => {
          box.checked = event.target.checked;
          box.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }}
    />
  );
}

/** Barra de borrado masivo: aparece cuando hay filas seleccionadas en la tabla asociada a `formId`. */
export function BulkDelete({
  action,
  formId,
  singular,
  plural,
  warning,
}: {
  action: Action;
  formId: string;
  /** p. ej. "pedido seleccionado" */
  singular: string;
  /** p. ej. "pedidos seleccionados" */
  plural: string;
  warning: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [selected, setSelected] = useState(0);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const count = () => setSelected(document.querySelectorAll(`input[form="${formId}"][name="ids"]:checked`).length);
    document.addEventListener("change", count);
    count();
    return () => document.removeEventListener("change", count);
  }, [formId]);

  // Tras borrar, la lista se recarga y la selección se reinicia.
  useEffect(() => {
    if (state.ok) {
      setConfirming(false);
      setSelected(0);
    }
  }, [state]);

  return (
    <form id={formId} action={formAction} className="min-h-6">
      {selected > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-red-400/30 bg-red-400/5 px-4 py-3">
          <span className="type-label text-bone">
            {selected} {selected === 1 ? singular : plural}
          </span>
          {!confirming ? (
            <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 type-label text-red-300 hover:text-red-200">
              <Trash2 className="h-4 w-4" strokeWidth={1.5} /> Eliminar…
            </button>
          ) : (
            <>
              <span className="text-sm text-steel">{warning}</span>
              <button disabled={pending} className={`${dangerButton} h-9`}>
                {pending ? "Eliminando…" : `Sí, eliminar ${selected}`}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="type-label text-steel hover:text-arc">
                Cancelar
              </button>
            </>
          )}
        </div>
      )}
      {state.message && selected === 0 && <p role="status" className="type-label text-emerald-300">{state.message}</p>}
      {state.error && <p role="alert" className="type-label text-red-300">{state.error}</p>}
    </form>
  );
}
