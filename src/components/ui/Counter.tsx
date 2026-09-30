"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

/** Counts up from 0 once visible. Writes to the DOM directly — no re-renders. */
export function Counter({ value, duration = 1.8, className }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = Math.round(v).toString();
      },
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
