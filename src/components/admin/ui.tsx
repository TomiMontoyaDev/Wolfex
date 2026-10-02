import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./format";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
      <div className="min-w-0">
        <p className="type-label text-arc">{eyebrow}</p>
        <h1 className="mt-3 type-display text-[clamp(2.4rem,5vw,4.5rem)]">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-sm leading-6 text-steel">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Panel({ title, index, action, children, className }: { title?: string; index?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-sm border border-line-strong bg-ink/80 p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {index && <p className="type-label text-arc">{index}</p>}
            {title && <h2 className={cn("type-title text-base", index && "mt-1.5")}>{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES: Record<Tone, string> = {
  neutral: "border-line-strong text-bone",
  accent: "border-volt/50 text-arc bg-volt/10",
  good: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
  warn: "border-amber-400/40 text-amber-200 bg-amber-400/10",
  bad: "border-red-400/40 text-red-300 bg-red-400/10",
  muted: "border-line-strong text-steel",
};

const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-bone",
  accent: "bg-arc",
  good: "bg-emerald-400",
  warn: "bg-amber-400",
  bad: "bg-red-400",
  muted: "bg-steel",
};

/** Etiqueta de estado: siempre texto + color, nunca solo color. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em]", TONES[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}

export function StatusBadge({ map, value }: { map: Record<string, { label: string; tone: Tone }>; value: string }) {
  const entry = map[value] ?? { label: value, tone: "neutral" as Tone };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}

export function DeltaBadge({ value, label = "vs período anterior" }: { value: number | null; label?: string }) {
  if (value === null) return <span className="type-label text-steel/70">Sin datos previos</span>;
  const up = value >= 0;
  return (
    <span className="type-label text-steel">
      <span className={up ? "text-emerald-300" : "text-red-300"}>
        {up ? "▲" : "▼"} {Math.abs(value * 100).toFixed(1)}%
      </span>{" "}
      {label}
    </span>
  );
}

export function KpiCard({ label, value, hint, footer, highlight }: { label: string; value: ReactNode; hint?: ReactNode; footer?: ReactNode; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex min-h-36 flex-col justify-between overflow-hidden rounded-sm border bg-ink/80 p-5",
        highlight ? "border-volt/40 shadow-[0_25px_80px_-55px_rgba(0,102,255,0.9)]" : "border-line-strong",
      )}
    >
      {highlight && <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-volt/20 blur-[70px]" />}
      <p className="relative type-label text-steel">{label}</p>
      <div className="relative mt-4">
        <p className="font-mono text-[clamp(1.4rem,2.2vw,1.9rem)] font-medium leading-none tracking-tight text-bone">{value}</p>
        {hint && <p className="mt-2 type-label text-steel/80">{hint}</p>}
      </div>
      {footer && <div className="relative mt-4 border-t border-line pt-3">{footer}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-line-strong px-6 py-14 text-center">
      <span className="type-label text-arc">— SIN DATOS —</span>
      <p className="mt-4 type-title text-lg">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-steel">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Table({ children, minWidth = 860 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-line-strong bg-ink/60">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, align = "left", className }: { children?: ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <th scope="col" className={cn("border-b border-line-strong px-4 py-3 type-label font-medium text-steel", align === "right" && "text-right", className)}>
      {children}
    </th>
  );
}

export function Td({ children, align = "left", className }: { children?: ReactNode; align?: "left" | "right"; className?: string }) {
  return <td className={cn("border-b border-line px-4 py-3.5 align-middle", align === "right" && "text-right", className)}>{children}</td>;
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  const link = "border border-line-strong px-4 py-2.5 type-label transition-colors hover:border-arc hover:text-arc";
  return (
    <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Paginación">
      {page > 1 ? <Link className={link} href={href(page - 1)}>← Anterior</Link> : <span />}
      <span className="type-label text-steel">
        Página {page} / {pages}
      </span>
      {page < pages ? <Link className={link} href={href(page + 1)}>Siguiente →</Link> : <span />}
    </nav>
  );
}

export function DefinitionList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([term, value]) => (
        <div key={term} className="min-w-0">
          <dt className="type-label text-steel">{term}</dt>
          <dd className="mt-1.5 break-words text-sm text-bone">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export const inputClass =
  "h-11 w-full rounded-sm border border-line-strong bg-void px-3 text-sm text-bone outline-none transition-[border-color,box-shadow] placeholder:text-steel/60 focus:border-arc focus:shadow-[0_0_0_3px_rgba(0,168,255,0.12)]";

export const buttonClass =
  "inline-flex h-11 items-center justify-center gap-2 border border-volt bg-volt px-5 type-label text-bone transition-[box-shadow,opacity] hover:shadow-[0_0_30px_rgba(0,102,255,0.38)] disabled:pointer-events-none disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 border border-line-strong px-5 type-label text-bone transition-colors hover:border-arc hover:text-arc disabled:pointer-events-none disabled:opacity-50";

/** Ítems de buildQuery con valor vacío se omiten, para URLs limpias. */
export function buildQuery(base: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-graphite", className)} />;
}
