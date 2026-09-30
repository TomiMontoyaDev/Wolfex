"use client";

import { useRef } from "react";
import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { gsap } from "@/lib/gsap";
import { PERFORMANCE_PILLARS, SITE } from "@/data/site";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Desktop: pinned horizontal scroll through TRAIN / MOVE / BUILD / REPEAT,
 * each word filling with light as it reaches centre. A HUD tracks 01 / 04.
 * Mobile & reduced motion: a vertical editorial stack — same content, no pin.
 */
export function PerformanceSection() {
  const { t } = useLanguage();
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const hudIndex = useRef<HTMLSpanElement>(null);
  const hudBar = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => tr.scrollWidth - window.innerWidth;

      const tween = gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const n = Math.min(4, Math.max(1, Math.ceil(self.progress * 4.4 - 0.4)));
            if (hudIndex.current) hudIndex.current.textContent = `0${n}`;
            if (hudBar.current) hudBar.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      gsap.utils.toArray<HTMLElement>(".perf-panel").forEach((panel) => {
        gsap.fromTo(
          panel.querySelector(".perf-fill"),
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            ease: "none",
            scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left 75%", end: "center 45%", scrub: true },
          },
        );
        gsap.fromTo(
          panel.querySelector(".perf-meta"),
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left 60%", end: "left 30%", scrub: true } },
        );
      });

      return () => tween.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={root} id="performance" className="relative overflow-hidden bg-ink lg:h-[100svh]" aria-labelledby="perf-title">
      <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-50" />
      <div className="pointer-events-none absolute right-0 top-0 h-[60vh] w-[50vw] rounded-full bg-volt/[0.07] blur-[160px]" />

      {/* HUD */}
      <div className="container-wfx absolute inset-x-0 top-0 z-10 hidden h-full flex-col justify-between py-10 pt-[calc(var(--nav-h)+1.5rem)] lg:flex pointer-events-none">
        <div className="flex items-center justify-between type-label text-steel">
          <span className="text-bone">{SITE.name}</span>
          <span>EST. {SITE.established}</span>
          <span>{t("Performance system")}</span>
          <span>
            <span ref={hudIndex} className="text-arc">01</span> / 04
          </span>
        </div>
        <div className="flex items-center gap-6 type-label text-steel">
          <span>{t("Scroll")}</span>
          <span className="relative h-px flex-1 bg-line-strong">
            <span ref={hudBar} className="absolute inset-0 origin-left scale-x-0 bg-arc" />
          </span>
          <span>{t("Designed for motion")}</span>
        </div>
      </div>

      <div ref={track} className="relative flex flex-col lg:h-full lg:w-max lg:flex-row lg:items-center">
        {/* Intro panel */}
        <div className="container-wfx flex flex-col justify-center py-28 lg:h-full lg:w-[62vw] lg:max-w-none lg:py-0">
          <p className="type-label text-arc lg:hidden">04 — {t("Performance system")}</p>
          <SplitReveal as="h2" text={t("Performance without limits.")} className="mt-6 type-display text-[8.6vw] lg:mt-0 lg:text-[5.2vw]" stagger={0.08} />
          <Reveal delay={0.2}>
            <p id="perf-title" className="mt-8 max-w-md type-body text-steel">
              {t("WOLFEX isn't just what you wear. It's how you operate — a system for training, moving and living at a higher standard.")}
            </p>
          </Reveal>
        </div>

        {PERFORMANCE_PILLARS.map((p) => (
          <div key={p.word} className="perf-panel relative flex border-t border-line lg:h-full lg:w-[80vw] lg:items-center lg:border-l lg:border-t-0">
            <div className="container-wfx py-16 lg:max-w-none lg:px-[5vw] lg:py-0">
              <div className="flex items-center gap-4 type-label text-steel">
                <span className="text-arc">{p.index}</span>
                <span className="h-px w-10 bg-line-strong" />
                <span>/ 04</span>
              </div>

              {/* Outline word with a light-fill that sweeps in on scroll */}
              <div className="relative mt-4">
                <Reveal y={50} className="lg:!transform-none lg:!opacity-100">
                  <p className="type-display text-[clamp(3.5rem,14vw,14rem)] leading-[0.82] text-bone lg:text-outline-volt" aria-hidden="true">{p.word}</p>
                </Reveal>
                <p className="perf-fill absolute inset-0 hidden type-display text-[clamp(3.5rem,14vw,14rem)] leading-[0.82] text-bone lg:block [text-shadow:0_0_40px_rgba(0,102,255,0.35)]">
                  {p.word}
                </p>
                <span className="sr-only">{p.word}</span>
              </div>

              <div className="perf-meta mt-8 grid max-w-2xl gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
                <p className="max-w-sm type-body text-bone/80">{t(p.line)}</p>
                <div className="sm:text-right">
                  <p className="font-mono text-4xl font-medium tracking-tight text-bone md:text-5xl">
                    <Counter value={p.metric.value} />
                    <span className="ml-1 text-lg text-arc">{p.metric.suffix}</span>
                  </p>
                  <p className="mt-1 type-label text-steel">{t(p.metric.label)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="hidden lg:block lg:w-[14vw]" />
      </div>
    </section>
  );
}
