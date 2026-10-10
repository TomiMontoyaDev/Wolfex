"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Botón "Copiar" (mín. 44 px de alto para el dedo). Copia el valor sin guiones ni espacios si `digitsOnly`. */
export function CopyButton({ value, label, digitsOnly = false, className }: { value: string; label: string; digitsOnly?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(digitsOnly ? value.replace(/\D/g, "") : value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {}
      }}
      aria-label={`Copiar ${label}`}
      className={cn(
        "flex h-11 shrink-0 items-center gap-1.5 border px-3 type-label text-[0.62rem] transition-colors",
        copied ? "border-arc bg-arc text-void" : "border-line-strong text-bone hover:border-arc hover:text-arc",
        className,
      )}
    >
      {copied ? <Check className="h-4 w-4" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
