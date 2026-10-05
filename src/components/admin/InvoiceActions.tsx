"use client";

import { Check, Copy } from "lucide-react";
import { useActionState, useState } from "react";
import type { ActionState } from "@/server/admin/actions";
import { markInvoiceIssuedAction } from "@/server/admin/invoice-actions";
import { buttonClass, ghostButtonClass, inputClass } from "./ui";

/** "Copiar datos": deja en el portapapeles el bloque para pegar en el software de facturación. */
export function CopyInvoiceData({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Navegadores sin permiso de portapapeles: copia con una selección temporal.
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button type="button" onClick={copy} className={ghostButtonClass}>
      {copied ? <Check className="h-4 w-4 text-emerald-300" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
      {copied ? "Copiado" : "Copiar datos"}
    </button>
  );
}

/** "Marcar como emitida": número de la factura electrónica DIAN + CUFE. También sirve para corregirlos. */
export function MarkIssuedForm({ orderId, issued, defaultNumber, defaultCufe }: { orderId: string; issued: boolean; defaultNumber?: string | null; defaultCufe?: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(markInvoiceIssuedAction, {});
  // Campos controlados: React limpia los formularios tras enviarlos y, si hay un error, se perdería lo escrito.
  const [number, setNumber] = useState(defaultNumber ?? "");
  const [cufe, setCufe] = useState(defaultCufe ?? "");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={issued ? ghostButtonClass : buttonClass}>
        {issued ? "Corregir factura" : "Marcar como emitida"}
      </button>
    );
  }
  return (
    <form action={action} className="w-full space-y-3 rounded-sm border border-line-strong bg-void/60 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
        <label className="block">
          <span className="type-label text-steel">No. factura electrónica</span>
          <input name="dianInvoiceNumber" required maxLength={40} value={number} onChange={(event) => setNumber(event.target.value)} placeholder="FE-1024" className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className="block">
          <span className="type-label text-steel">CUFE (96 caracteres)</span>
          <input name="cufe" required maxLength={120} value={cufe} onChange={(event) => setCufe(event.target.value)} placeholder="Cópialo de la factura o del correo de la DIAN" className={`mt-1.5 font-mono text-xs ${inputClass}`} />
        </label>
      </div>
      {state.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-300">{state.message}</p>}
      <div className="flex gap-2">
        <button disabled={pending} className={buttonClass}>
          {pending ? "Guardando…" : "Guardar como emitida"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={ghostButtonClass}>
          Cerrar
        </button>
      </div>
    </form>
  );
}
