"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useIntro } from "@/components/providers/IntroProvider";
import { SITE } from "@/data/site";
import { WolfMark, Wordmark } from "@/components/visuals/WolfMark";
import { pad } from "@/lib/utils";

const COUNT_MS = 1500;
const TAGLINE_MS = 850;

/**
 * Minimal intro: WOLFEX → 01…100% with an electric bar → HUNT YOUR APEX. → site.
 * Runs in full once per session; later visits get a near-instant fade.
 */
export function Loader() {
  const { markReady } = useIntro();
  const [progress, setProgress] = useState(1);
  const [phase, setPhase] = useState<"count" | "tagline" | "done">("count");

  useEffect(() => {
    const seen = sessionStorage.getItem("wfx-intro") === "1";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) {
      setPhase("done");
      markReady();
      return;
    }
    document.documentElement.style.overflow = "hidden";

    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min((t - start) / COUNT_MS, 1);
      // ease-in-out so the count feels deliberate, not linear
      const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setProgress(Math.max(1, Math.round(eased * 100)));
      if (k < 1) raf = requestAnimationFrame(tick);
      else setPhase("tagline");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [markReady]);

  useEffect(() => {
    if (phase !== "tagline") return;
    const t = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("wfx-intro", "1");
      document.documentElement.style.overflow = "";
      markReady();
    }, TAGLINE_MS);
    return () => clearTimeout(t);
  }, [phase, markReady]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="loader"
          id="wfx-loader"
          className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-void"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-live="polite"
          aria-label="Cargando WOLFEX"
        >
          <div className="absolute inset-0 bg-tech-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 text-bone"
            >
              <WolfMark outline className="h-14 w-auto md:h-16" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)", filter: "blur(8px)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)", filter: "blur(0px)" }}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.76, 0, 0.24, 1] }}
              className="text-bone"
            >
              <Wordmark className="h-auto w-[min(72vw,520px)]" />
            </motion.div>

            <div className="mt-6 h-6 overflow-hidden">
              <AnimatePresence mode="wait">
                {phase === "count" ? (
                  <motion.div key="count" className="flex items-center gap-4 type-label text-steel" exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.4 }}>
                    <span>{pad(progress, 3)}</span>
                    <span className="relative h-px w-40 bg-line-strong sm:w-56">
                      <span className="absolute inset-y-0 left-0 bg-volt shadow-[0_0_12px_rgba(0,168,255,0.9)]" style={{ width: `${progress}%` }} />
                    </span>
                    <span>100%</span>
                  </motion.div>
                ) : (
                  <motion.p
                    key="tag"
                    className="type-title text-sm text-arc tracking-[0.3em]"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {SITE.tagline}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex justify-between px-[var(--gutter)] type-label text-steel/70">
            <span>EST. {SITE.established}</span>
            <span>SISTEMA DE RENDIMIENTO</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
