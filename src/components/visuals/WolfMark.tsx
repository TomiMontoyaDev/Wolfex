"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { MARK_H, MARK_PATH, MARK_VIEWBOX, MARK_W, WORDMARK_H, WORDMARK_PATH, WORDMARK_VIEWBOX, WORDMARK_W } from "./logo-paths";

/**
 * WOLFEX official mark (wolf head).
 * `animate` = logo reveal: the contour is drawn in electric blue, then the mark fills.
 * `outline` = flat single-colour version (small sizes, prints, footer).
 */
interface WolfMarkProps {
  className?: string;
  animate?: boolean;
  outline?: boolean;
  delay?: number;
  /** Explicit width in user units — required when nesting inside another <svg>. */
  size?: number;
}

export function WolfMark({ className, animate = false, outline = false, delay = 0, size }: WolfMarkProps) {
  const uid = useId().replace(/:/g, "");
  const dims = { width: size, height: size ? (size * MARK_H) / MARK_W : undefined };

  if (outline) {
    return (
      <svg viewBox={MARK_VIEWBOX} {...dims} className={cn("overflow-visible", className)} aria-hidden="true">
        <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" />
      </svg>
    );
  }

  return (
    <svg viewBox={MARK_VIEWBOX} {...dims} className={cn("overflow-visible", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5F7FA" />
          <stop offset="70%" stopColor="#E6ECF5" />
          <stop offset="100%" stopColor="#9FD4FF" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* contour draw */}
      <motion.path
        d={MARK_PATH}
        fill="none"
        stroke="#00A8FF"
        strokeWidth={1.6}
        strokeLinejoin="round"
        filter={`url(#${uid}-glow)`}
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: [1, 1, 0.55] }}
        transition={{ duration: 1.8, delay, ease: [0.76, 0, 0.24, 1] }}
      />
      {/* fill */}
      <motion.path
        d={MARK_PATH}
        fill={`url(#${uid}-fill)`}
        fillRule="evenodd"
        initial={animate ? { opacity: 0, clipPath: "inset(-10% 110% -10% -10%)" } : false}
        animate={{ opacity: 1, clipPath: "inset(-10% -10% -10% -10%)" }}
        transition={{ duration: 1.1, delay: delay + 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

/** WOLFEX official wordmark. Fills with currentColor unless `variant="outline"`. */
export function Wordmark({
  className,
  size,
  variant = "fill",
  title = "WOLFEX",
}: {
  className?: string;
  size?: number;
  variant?: "fill" | "outline";
  title?: string;
}) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      width={size}
      height={size ? (size * WORDMARK_H) / WORDMARK_W : undefined}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={title}
    >
      <path
        d={WORDMARK_PATH}
        fillRule="evenodd"
        fill={variant === "fill" ? "currentColor" : "none"}
        stroke={variant === "outline" ? "currentColor" : undefined}
        strokeWidth={variant === "outline" ? 1.2 : undefined}
        vectorEffect={variant === "outline" ? "non-scaling-stroke" : undefined}
      />
    </svg>
  );
}

export const WORDMARK_RATIO = WORDMARK_W / WORDMARK_H;
export const MARK_RATIO = MARK_W / MARK_H;
