"use client";

import { useRef } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { gsap } from "@/lib/gsap";
import { MEDIA } from "@/data/media";

export function CampaignSection() {
  const root = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      // Image drifts slower than the page and settles from a slight zoom.
      gsap.fromTo(
        ".campaign-media",
        { yPercent: -12, scale: 1.18 },
        { yPercent: 12, scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
      );
      // Overlay deepens as the section leaves.
      gsap.fromTo(".campaign-shade", { opacity: 0.35 }, { opacity: 0.8, ease: "none", scrollTrigger: { trigger: el, start: "center center", end: "bottom top", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-[115svh] min-h-[680px] overflow-hidden bg-void" aria-labelledby="campaign-title">
      <div className="campaign-media absolute inset-0 will-change-transform">
        <Media slot={MEDIA.campaign} preferVideo sizes="100vw" />
      </div>
      <div className="campaign-shade absolute inset-0 bg-void" />
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-void via-transparent to-void" />
      <div className="light-sweep absolute inset-0 overflow-hidden" />

      <div className="container-wfx relative flex h-full flex-col justify-between py-24 md:py-32">
        <div className="flex justify-between type-label text-steel">
          <span>Campaign 01</span>
          <span className="hidden sm:block">WOLFEX — Film / Photo</span>
        </div>

        <div>
          <SplitReveal as="h2" text="Built different." className="type-display text-[clamp(2.25rem,9.2vw,9.5rem)]" stagger={0.1} />
          <Reveal delay={0.3} y={40}>
            <p id="campaign-title" className="mt-8 max-w-md type-title text-base leading-snug text-bone/80 md:text-lg">
              Performance isn&apos;t a destination.
              <span className="text-arc"> It&apos;s a standard.</span>
            </p>
            <div className="mt-10">
              <MagneticButton href="#categories" variant="light">Discover WOLFEX</MagneticButton>
            </div>
          </Reveal>
        </div>

        <div className="flex items-end justify-between type-label text-steel">
          <span>No comfort.</span>
          <span className="text-bone/60">WFX-CMP-01</span>
        </div>
      </div>
    </section>
  );
}
