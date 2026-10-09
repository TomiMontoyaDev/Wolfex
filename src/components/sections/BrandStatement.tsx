"use client";

import { useRef } from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { gsap } from "@/lib/gsap";

const MANIFESTO =
  "WOLFEX is built for those who refuse to stay at the same level. We don't chase comfort. We chase the next version of ourselves.";

const CODE = [
  { a: "Discipline", b: "Comfort" },
  { a: "Progress", b: "Excuses" },
  { a: "Instinct", b: "Hesitation" },
];

export function BrandStatement() {
  const { t } = useLanguage();
  const root = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // Words light up one by one as the reader scrolls — scrubbed to scroll.
      gsap.fromTo(
        ".code-word",
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: { trigger: ".code-manifesto", start: "top 80%", end: "bottom 45%", scrub: 0.6 },
        },
      );

      gsap.utils.toArray<HTMLElement>(".code-line").forEach((line) => {
        gsap.fromTo(
          line,
          { yPercent: 60, opacity: 0, clipPath: "inset(0 0 100% 0)" },
          {
            yPercent: 0,
            opacity: 1,
            clipPath: "inset(0 0 0% 0)",
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: { trigger: line, start: "top 88%" },
          },
        );
        gsap.fromTo(
          line.querySelector(".code-rule"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: line, start: "top 88%" } },
        );
      });

      gsap.fromTo(
        ".code-apex",
        { letterSpacing: "0.25em", opacity: 0, filter: "blur(10px)" },
        {
          letterSpacing: "0em",
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.6,
          ease: "expo.out",
          scrollTrigger: { trigger: ".code-apex", start: "top 85%" },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="code" className="relative overflow-hidden bg-void py-28 md:py-44" aria-labelledby="code-title">
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-volt/[0.07] blur-[140px]" />

      <div className="container-wfx">
        <SectionLabel index="03" label={t("The WOLFEX Code")} meta={t("Manifesto — WFX/M-01")} />

        <div className="mt-16 grid gap-16 md:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <h2 id="code-title" className="type-title text-sm text-steel lg:sticky lg:top-32">
              {t("The")} <span className="text-bone">WOLFEX</span> {t("Code")}
              <span className="mt-4 block max-w-[16rem] type-body text-sm normal-case tracking-normal text-steel">
                {t("Three rules. No exceptions. Written for the ones who train when nobody is watching.")}
              </span>
            </h2>
          </div>

          <div className="lg:col-span-9">
            <p className="code-manifesto type-headline text-[clamp(1.9rem,4.6vw,4.25rem)] leading-[1.02]">
              {t(MANIFESTO).split(" ").map((w, i) => (
                <span key={i} className={`code-word inline-block ${w === "WOLFEX" ? "text-arc" : ""}`}>
                  {w}&nbsp;
                </span>
              ))}
            </p>

            <ol className="mt-20 md:mt-28">
              {CODE.map((c, i) => (
                <li key={c.a} className="code-line relative py-6 md:py-8">
                  <span className="code-rule absolute inset-x-0 top-0 h-px origin-left bg-line-strong" />
                  <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 md:grid-cols-[5rem_1fr_auto] md:gap-x-8">
                    <span className="type-label text-arc">0{i + 1}</span>
                    <p className="type-display text-[clamp(1.6rem,5vw,4.75rem)] leading-none">
                      {t(c.a)}{" "}
                      <span className="mx-3 align-middle font-mono text-[0.22em] font-normal normal-case tracking-[0.2em] text-steel md:mx-5">{t("over")}</span>{" "}
                      <span className="text-outline">{t(c.b)}</span>
                    </p>
                    <span className="hidden type-label text-steel md:block">WFX-C0{i + 1}</span>
                  </div>
                </li>
              ))}
            </ol>

            <p className="code-apex mt-16 type-display text-[clamp(2.5rem,8vw,7.5rem)] text-volt text-glow md:mt-24">{t("Hunt your apex.")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
