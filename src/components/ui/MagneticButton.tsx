"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "light";

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  /** Pull strength in px. */
  strength?: number;
  arrow?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-volt text-bone shadow-[0_0_0_1px_rgba(0,168,255,0.35),0_12px_40px_-12px_rgba(0,102,255,0.8)] hover:shadow-[0_0_0_1px_rgba(0,168,255,0.7),0_16px_60px_-10px_rgba(0,102,255,0.95)]",
  ghost: "border border-line-strong text-bone hover:border-arc/60 hover:bg-bone/[0.03]",
  light: "bg-bone text-void hover:bg-white",
};

/** CTA that leans toward the cursor, with an internal light sweep. */
export function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  className,
  strength = 14,
  arrow = true,
  type = "button",
  disabled,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16, mass: 0.4 });

  const onMove = (e: MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set(((e.clientX - r.left) / r.width - 0.5) * strength * 2);
    y.set(((e.clientY - r.top) / r.height - 0.5) * strength * 1.4);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const inner = (
    <>
      <span className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-[left,opacity] duration-700 ease-[var(--ease-apex)] group-hover:left-[120%] group-hover:opacity-100" />
      </span>
      <span className="relative">{children}</span>
      {arrow && (
        <span className="relative flex h-4 w-4 overflow-hidden">
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-500 ease-[var(--ease-apex)] group-hover:translate-x-full" strokeWidth={1.75} />
          <ArrowRight className="h-4 w-4 shrink-0 -translate-x-[200%] transition-transform duration-500 ease-[var(--ease-apex)] group-hover:-translate-x-full" strokeWidth={1.75} />
        </span>
      )}
    </>
  );

  const classes = cn(
    "group relative inline-flex h-14 items-center justify-center gap-3 px-8 type-title text-[0.8125rem] transition-[background-color,box-shadow,border-color] duration-500",
    styles[variant],
    disabled && "pointer-events-none opacity-50",
    className,
  );

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={reset} style={{ x, y }} className="inline-flex" data-cursor="hover">
      {href ? (
        <a href={href} className={classes} onClick={onClick}>
          {inner}
        </a>
      ) : (
        <button type={type} onClick={onClick} className={classes} disabled={disabled}>
          {inner}
        </button>
      )}
    </motion.div>
  );
}
