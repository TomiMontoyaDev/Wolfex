"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SplitRevealProps {
  text: string;
  className?: string;
  /** Split into masked words (default) or characters. */
  by?: "word" | "char";
  delay?: number;
  stagger?: number;
  /** Animate immediately (controlled) instead of on scroll. */
  play?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

/** Masked slide-up text reveal — the core editorial headline motion. */
export function SplitReveal({ text, className, by = "word", delay = 0, stagger = 0.06, play, as = "h2" }: SplitRevealProps) {
  const Tag = motion[as];
  const words = text.split(" ");
  const controlled = play !== undefined;

  let charIndex = 0;

  return (
    <Tag
      className={cn("flex flex-wrap", className)}
      aria-label={text}
      initial="hidden"
      {...(controlled ? { animate: play ? "show" : "hidden" } : { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } })}
    >
      {words.map((word, wi) => (
        <span key={wi} className="inline-flex overflow-hidden pb-[0.08em] -mb-[0.08em]" aria-hidden="true">
          {(by === "char" ? word.split("") : [word]).map((chunk, ci) => {
            const i = by === "char" ? charIndex++ : wi;
            return (
              <motion.span
                key={ci}
                className="inline-block will-change-transform"
                variants={{
                  hidden: { y: "110%", opacity: 0 },
                  show: { y: "0%", opacity: 1, transition: { duration: 1.1, delay: delay + i * stagger, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                {chunk}
              </motion.span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
}
