"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { MEDIA } from "@/data/media";
import { SOCIALS } from "@/data/site";
import { pad } from "@/lib/utils";

const CAPTIONS = ["5AM crew", "Night run", "Heavy day", "Motor meet"];

export function Community() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const colA = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const colB = useTransform(scrollYProgress, [0, 1], ["-4%", "10%"]);

  return (
    <section ref={ref} id="community" className="relative overflow-hidden bg-ink py-28 md:py-40" aria-labelledby="pack-title">
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[560px] w-[560px] rounded-full bg-volt/[0.08] blur-[150px]" />
      <div className="container-wfx">
        <SectionLabel index="06" label="Community" meta="#WOLFEXPACK" />

        <div className="mt-14 grid gap-16 lg:mt-20 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5 lg:pt-10">
            <SplitReveal as="h2" text="Run with the pack." className="type-display text-[clamp(3rem,7vw,7rem)]" />
            <Reveal delay={0.2}>
              <p id="pack-title" className="mt-8 max-w-md type-body text-steel">
                WOLFEX is bigger than a logo. It&apos;s the 5AM sessions, the night runs, the people who push you past the point you
                would have stopped alone. Wear it. Tag it. Train with us.
              </p>
              <div className="mt-10">
                <MagneticButton href="#join">Join WOLFEX</MagneticButton>
              </div>
            </Reveal>
          </div>

          {/* Mosaic */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:col-span-7">
            {[colA, colB].map((y, col) => (
              <motion.div key={col} style={{ y }} className={col === 1 ? "mt-12 space-y-3 md:mt-24 md:space-y-4" : "space-y-3 md:space-y-4"}>
                {MEDIA.community.filter((_, i) => i % 2 === col).map((slot, j) => {
                  const i = j * 2 + col;
                  return (
                    <figure key={slot.src} className="group relative aspect-[4/5] overflow-hidden bg-void" data-cursor="view" data-cursor-label="Pack">
                      <div className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-apex)] group-hover:scale-105">
                        <Media slot={slot} sizes="(min-width:1024px) 28vw, 50vw" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />
                      <figcaption className="absolute inset-x-3 bottom-3 flex items-center justify-between type-label md:inset-x-4 md:bottom-4">
                        <span className="text-bone">{CAPTIONS[i]}</span>
                        <span className="text-arc">{pad(i + 1)}</span>
                      </figcaption>
                    </figure>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Channels — designed as pack destinations, not icon buttons */}
        <ul className="mt-24 border-t border-line md:mt-32">
          {SOCIALS.map((s, i) => (
            <li key={s.platform} className="border-b border-line">
              <a href={s.href} target="_blank" rel="noreferrer" className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 overflow-hidden py-6 md:grid-cols-[4rem_1fr_1fr_auto] md:gap-8 md:py-8">
                <span className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-volt/15 to-transparent transition-transform duration-700 ease-[var(--ease-apex)] group-hover:scale-x-100" />
                <span className="relative type-label text-arc">{pad(i + 1)}</span>
                <span className="relative flex items-center gap-4">
                  <SocialIcon platform={s.platform} className="h-5 w-5 text-steel transition-colors group-hover:text-arc md:h-6 md:w-6" />
                  <span className="type-headline text-[clamp(1.5rem,4vw,3.25rem)] transition-transform duration-500 ease-[var(--ease-apex)] group-hover:translate-x-2">{s.label}</span>
                </span>
                <span className="relative hidden text-sm text-steel md:block">{s.pitch}</span>
                <span className="relative flex items-center gap-3 type-label text-bone/80">
                  <span className="hidden sm:inline">{s.handle}</span>
                  <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" strokeWidth={1.5} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
