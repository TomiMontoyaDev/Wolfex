"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  orders: number;
}

const HEIGHT = 220;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_LEFT = 64;

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

const compact = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

/** Barras de una sola serie (ventas por período) con tooltip al pasar el cursor o enfocar. */
export function BarChart({ data, title, labelEvery = 1 }: { data: BarDatum[]; title: string; labelEvery?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 760;
  const plotW = width - PAD_LEFT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const slot = plotW / Math.max(data.length, 1);
  const barW = Math.max(3, Math.min(28, slot - 2));
  const ticks = [0, 0.5, 1].map((t) => max * t);
  const current = active !== null ? data[active] : null;

  return (
    <figure className="relative">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${HEIGHT}`} className="h-auto w-full min-w-[520px]" role="img" aria-label={title} onMouseLeave={() => setActive(null)}>
          {ticks.map((tick) => {
            const y = PAD_TOP + plotH - (tick / max) * plotH;
            return (
              <g key={tick}>
                <line x1={PAD_LEFT} x2={width} y1={y} y2={y} stroke="rgb(245 247 250 / 0.08)" strokeWidth={1} />
                <text x={PAD_LEFT - 10} y={y + 4} textAnchor="end" className="fill-steel font-mono text-[10px]">
                  {compact.format(tick)}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const h = d.value > 0 ? Math.max(2, (d.value / max) * plotH) : 0;
            const x = PAD_LEFT + i * slot + (slot - barW) / 2;
            const y = PAD_TOP + plotH - h;
            const isActive = active === i;
            return (
              <g key={d.key}>
                {/* Zona de interacción más grande que la barra. */}
                <rect
                  x={PAD_LEFT + i * slot}
                  y={PAD_TOP}
                  width={slot}
                  height={plotH}
                  fill={isActive ? "rgb(0 102 255 / 0.06)" : "transparent"}
                  tabIndex={0}
                  aria-label={`${d.label}: ${formatPrice(d.value)}, ${d.orders} pedidos`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="outline-none"
                />
                {h > 0 && (
                  <path
                    d={`M${x},${y + h} V${y + Math.min(4, h)} Q${x},${y} ${x + Math.min(4, barW / 2)},${y} H${x + barW - Math.min(4, barW / 2)} Q${x + barW},${y} ${x + barW},${y + Math.min(4, h)} V${y + h} Z`}
                    fill={isActive ? "#00a8ff" : "#0066ff"}
                    pointerEvents="none"
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={PAD_LEFT + i * slot + slot / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-steel font-mono text-[10px]">
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={PAD_LEFT} x2={width} y1={PAD_TOP + plotH} y2={PAD_TOP + plotH} stroke="rgb(245 247 250 / 0.16)" strokeWidth={1} />
        </svg>
      </div>
      <div className="mt-3 flex min-h-10 flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-line pt-3" aria-live="polite">
        {current ? (
          <>
            <span className="type-label text-arc">{current.label}</span>
            <span className="font-mono text-sm text-bone">{formatPrice(current.value)}</span>
            <span className="type-label text-steel">
              {current.orders} {current.orders === 1 ? "pedido" : "pedidos"}
            </span>
          </>
        ) : (
          <span className="type-label text-steel/70">Pasa el cursor sobre una barra para ver el detalle</span>
        )}
      </div>
    </figure>
  );
}
