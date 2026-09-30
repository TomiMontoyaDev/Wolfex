"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Precision cursor: a dot that tracks 1:1 and a ring that trails behind.
 * The ring expands over anything interactive ([data-cursor], a, button).
 * Only mounts on fine pointers — touch devices keep native behaviour.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<"idle" | "hover" | "view">("idle");
  const [label, setLabel] = useState("");
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!mq.matches || reduce) return;
    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button, input");
      if (!el) {
        setState("idle");
        setLabel("");
        return;
      }
      const kind = el.dataset.cursor;
      setState(kind === "view" ? "view" : "hover");
      setLabel(el.dataset.cursorLabel ?? "");
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [x, y]);

  if (!enabled) return null;

  const size = state === "view" ? 88 : state === "hover" ? 46 : 30;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true">
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: size,
          height: size,
          borderColor: state === "idle" ? "rgba(245,247,250,0.28)" : "rgba(0,168,255,0.8)",
          backgroundColor: state === "view" ? "rgba(0,102,255,0.9)" : "rgba(0,102,255,0)",
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {state === "view" && <span className="type-label !text-[0.625rem] text-bone">{label || "VIEW"}</span>}
      </motion.div>
      <motion.div
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-arc"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: state === "view" ? 0 : 1 }}
      />
    </div>
  );
}
