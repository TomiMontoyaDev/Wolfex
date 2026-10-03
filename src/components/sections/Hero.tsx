"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { useIntro } from "@/components/providers/IntroProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Media } from "@/components/ui/Media";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Particles } from "@/components/visuals/Particles";
import { WolfMark, Wordmark } from "@/components/visuals/WolfMark";
import { MEDIA } from "@/data/media";
import { SITE } from "@/data/site";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const { ready } = useIntro();

  // Cursor-reactive depth: each layer moves a different amount.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 0.8 });
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 0.8 });
  const farX = useTransform(sx, (v) => v * -14);
  const farY = useTransform(sy, (v) => v * -10);
  const wolfX = useTransform(sx, (v) => v * 26);
  const wolfY = useTransform(sy, (v) => v * 18);
  const wolfRot = useTransform(sx, (v) => v * 3);
  const typeX = useTransform(sx, (v) => v * -10);
  const glowX = useTransform(sx, (v) => `${50 + v * 12}%`);
  const glowY = useTransform(sy, (v) => `${42 + v * 10}%`);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  // Scroll-out parallax.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[640px] overflow-hidden bg-void" aria-label={`WOLFEX — ${t("Hunt your apex.")}`}>
      {/* ── Atmosphere (far layer) ── */}
      <motion.div className="absolute inset-[-6%]" style={{ x: farX, y: farY }}>
        <motion.div
          className="absolute h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80"
          style={{
            left: glowX,
            top: glowY,
            background: "radial-gradient(circle, rgba(0,102,255,0.28) 0%, rgba(6,21,47,0.55) 35%, rgba(5,5,5,0) 70%)",
          }}
        />
        <div className="absolute inset-0 bg-tech-grid opacity-60 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent)]" />
        {/* smoke */}
        <div className="absolute bottom-[-10%] left-[-10%] h-[55%] w-[70%] animate-drift rounded-full bg-abyss/80 blur-[90px]" />
        <div className="absolute bottom-[-5%] right-[-15%] h-[45%] w-[60%] animate-drift rounded-full bg-volt/10 blur-[110px] [animation-delay:-9s]" />
      </motion.div>

      {/* ── Central visual ── */}
      <motion.div className="absolute inset-0" style={{ y: mediaY, scale: mediaScale }}>
        {MEDIA.hero.ready ? (
          <motion.div className="absolute inset-0" initial={{ opacity: 0, scale: 1.08 }} animate={ready ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 2, ease }}>
            <Media slot={MEDIA.hero} priority preferVideo sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-b from-void/40 via-void/10 to-void" />
          </motion.div>
        ) : (
          <div className="absolute left-1/2 top-[38%] w-[min(72vw,400px)] -translate-x-1/2 -translate-y-1/2 md:top-[36%] md:w-[min(33vw,500px)]">
            <motion.div className="relative aspect-[420/353]" style={{ x: wolfX, y: wolfY, rotate: wolfRot }}>
              <div className="absolute inset-[12%] animate-pulse-glow rounded-full bg-volt/25 blur-[80px]" />
              {ready && <WolfMark animate className="relative h-full w-full drop-shadow-[0_0_30px_rgba(0,102,255,0.35)]" />}
            </motion.div>
          </div>
        )}
      </motion.div>

      <Particles className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* Bottom fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-void via-void/70 to-transparent" />

      {/* ── Type + CTAs ── */}
      <motion.div className="relative z-10 flex h-full flex-col justify-end pb-10 md:pb-14" style={{ y: contentY, opacity: contentOpacity }}>
        <div className="container-wfx">
          <motion.div style={{ x: typeX }}>
            <h1 className="relative">
              <span className="sr-only">WOLFEX — Hunt your apex</span>
              <motion.span
                className="block text-bone"
                initial={{ clipPath: "inset(-30% 106% -30% -6%)", opacity: 0, filter: "blur(12px)" }}
                animate={ready ? { clipPath: "inset(-30% -6% -30% -6%)", opacity: 1, filter: "blur(0px)" } : {}}
                transition={{ duration: 1.4, delay: 0.3, ease: [0.76, 0, 0.24, 1] }}
                aria-hidden="true"
              >
                <Wordmark className="mx-auto block h-auto w-full max-w-[1500px] drop-shadow-[0_0_40px_rgba(0,102,255,0.28)]" title="" />
              </motion.span>
            </h1>
          </motion.div>

          <div className="mt-6 flex flex-col items-center gap-8 md:mt-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-center md:items-start">
              <motion.div
                className="h-px w-16 origin-left bg-volt"
                initial={{ scaleX: 0 }}
                animate={ready ? { scaleX: 1 } : {}}
                transition={{ duration: 1, delay: 0.9, ease }}
              />
              <SplitReveal
                as="p"
                text={SITE.tagline}
                play={ready}
                delay={1}
                stagger={0.09}
                className="mt-4 type-headline text-[clamp(1.35rem,3.2vw,2.5rem)] text-arc text-glow"
              />
              <motion.p
                className="mt-3 max-w-xs text-center type-body text-sm text-steel md:text-left"
                initial={{ opacity: 0 }}
                animate={ready ? { opacity: 1 } : {}}
                transition={{ duration: 1, delay: 1.4 }}
              >
                {t("Performance supplements for those who refuse to stay at the same level.")}
              </motion.p>
            </div>

            <motion.div
              className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
              initial={{ opacity: 0, y: 24 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 1.3, ease }}
            >
              <MagneticButton href="#drop" className="w-full sm:w-auto [&>a]:w-full">{t("Shop supplements")}</MagneticButton>
              <MagneticButton href="#code" variant="ghost" arrow={false} className="w-full sm:w-auto [&>a]:w-full">
                {t("Explore WOLFEX")}
              </MagneticButton>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Technical frame details ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 hidden md:block"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: 1.2, delay: 1.6 }}
      >
        <div className="container-wfx absolute inset-x-0 top-[calc(var(--nav-h)+1.5rem)] flex justify-between type-label text-steel">
          <span>WFX-001 / {t("SUPPLEMENTS")} {SITE.established}</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-arc" /> {t("Nationwide shipping — live")}
          </span>
        </div>
        <span className="absolute left-[var(--gutter)] top-1/2 -translate-y-1/2 -rotate-90 origin-left translate-x-3 type-label text-steel/80">
          {t("Built for your progress")}
        </span>
        <div className="absolute right-[var(--gutter)] top-1/2 flex -translate-y-1/2 flex-col items-end gap-3 type-label text-steel/80">
          <span className="text-bone">01</span>
          <span className="h-16 w-px bg-line-strong">
            <span className="block h-1/4 w-px bg-arc" />
          </span>
          <span>04</span>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 2 }}
      >
        <span className="relative h-8 w-px overflow-hidden bg-line-strong">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-arc"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
