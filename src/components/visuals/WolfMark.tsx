"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * WOLFEX WOLF MARK — faceted, abstract wolf head.
 * Built from mirrored facets so it reads as geometry first, wolf second.
 * `animate` draws the edges in (logo reveal) before the facets fill.
 */

type P = [number, number];
const W = 400;
const m = ([x, y]: P): P => [W - x, y];

// Left-half landmarks (right half is mirrored).
const L = {
  earTip: [116, 28] as P,
  earInner: [150, 104] as P,
  earBase: [174, 128] as P,
  earOuter: [90, 152] as P,
  crown: [200, 116] as P,
  brow: [128, 196] as P,
  browMid: [200, 178] as P,
  eyeOut: [140, 216] as P,
  eyeIn: [178, 224] as P,
  cheek: [62, 252] as P,
  bone: [118, 264] as P,
  jaw: [100, 322] as P,
  muzzle: [160, 302] as P,
  bridge: [200, 272] as P,
  snout: [170, 374] as P,
  nose: [200, 394] as P,
  ruff: [146, 404] as P,
  chin: [200, 432] as P,
};

type Facet = { pts: P[]; shade: number };

const leftFacets: Facet[] = [
  { pts: [L.earTip, L.earBase, L.earOuter], shade: 0.5 },
  { pts: [L.earTip, L.earInner, L.earBase], shade: 0.95 },
  { pts: [L.earBase, L.crown, L.browMid, L.brow], shade: 0.42 },
  { pts: [L.earOuter, L.earBase, L.brow, L.cheek], shade: 0.3 },
  { pts: [L.cheek, L.brow, L.eyeOut, L.bone], shade: 0.22 },
  { pts: [L.brow, L.browMid, L.eyeIn, L.eyeOut], shade: 0.55 },
  { pts: [L.cheek, L.bone, L.jaw], shade: 0.14 },
  { pts: [L.bone, L.eyeOut, L.eyeIn, L.muzzle], shade: 0.34 },
  { pts: [L.eyeIn, L.browMid, L.bridge, L.muzzle], shade: 0.48 },
  { pts: [L.jaw, L.bone, L.muzzle, L.snout], shade: 0.2 },
  { pts: [L.muzzle, L.bridge, L.nose, L.snout], shade: 0.38 },
  { pts: [L.jaw, L.snout, L.ruff], shade: 0.1 },
  { pts: [L.ruff, L.snout, L.nose, L.chin], shade: 0.16 },
];

// Light comes from the upper right: right facets are a touch brighter.
const facets: Facet[] = [
  ...leftFacets,
  ...leftFacets.map((f) => ({ pts: f.pts.map(m), shade: Math.min(1, f.shade * 1.45 + 0.06) })),
];

const toPoints = (pts: P[]) => pts.map((p) => p.join(",")).join(" ");
const toPath = (pts: P[]) => `M${pts.map((p) => p.join(",")).join("L")}Z`;

const eyeL: P[] = [[146, 222], [180, 230], [168, 238], [150, 232]];
const eyeR = eyeL.map(m);

interface WolfMarkProps {
  className?: string;
  animate?: boolean;
  /** Show only the outline — used small in navbar/footer. */
  outline?: boolean;
  delay?: number;
  /** Explicit width in user units — required when nesting inside another <svg>. */
  size?: number;
}

export function WolfMark({ className, animate = false, outline = false, delay = 0, size }: WolfMarkProps) {
  const id = outline ? "wm-o" : "wm";
  return (
    <svg
      viewBox="0 0 400 440"
      width={size}
      height={size ? size * 1.1 : undefined}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d2a5c" />
          <stop offset="55%" stopColor="#06152F" />
          <stop offset="100%" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00A8FF" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#0066FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0.12" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {!outline &&
        facets.map((f, i) => (
          <motion.polygon
            key={i}
            points={toPoints(f.pts)}
            fill={`url(#${id}-fill)`}
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 0.35 + f.shade * 0.65 }}
            transition={{ duration: 1.4, delay: delay + 0.9 + (i % 13) * 0.04 }}
          />
        ))}

      {facets.map((f, i) => (
        <motion.path
          key={`e${i}`}
          d={toPath(f.pts)}
          fill="none"
          stroke={`url(#${id}-edge)`}
          strokeWidth={outline ? 6 : 0.9}
          strokeLinejoin="round"
          vectorEffect={outline ? undefined : "non-scaling-stroke"}
          initial={animate ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, delay: delay + (i % 13) * 0.05, ease: [0.76, 0, 0.24, 1] }}
        />
      ))}

      {[eyeL, eyeR].map((eye, i) => (
        <motion.polygon
          key={`eye${i}`}
          points={toPoints(eye)}
          fill="#00A8FF"
          filter={outline ? undefined : `url(#${id}-glow)`}
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: delay + 1.9 }}
        />
      ))}
    </svg>
  );
}
