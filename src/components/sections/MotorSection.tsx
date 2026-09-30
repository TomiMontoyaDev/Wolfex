"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MEDIA } from "@/data/media";
import { useLanguage } from "@/components/providers/LanguageProvider";

const SPECS = [
  { k: "Chapter", v: "02 — Motor" },
  { k: "Code", v: "WFX/M-01" },
  { k: "Status", v: "In development" },
  { k: "Mode", v: "Night shift" },
];

/** A cultural extension of the brand — not a showroom. */
export function MotorSection() {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineA = useTransform(scrollYProgress, [0, 1], ["5%", "-35%"]);
  const lineB = useTransform(scrollYProgress, [0, 1], ["-40%", "0%"]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const imgScale = useTransform(scrollYProgress, [0, 0.5], [1.15, 1]);

  return (
    <section ref={ref} id="motor" className="relative overflow-hidden bg-void py-28 md:py-40" aria-labelledby="motor-title">
      <div className="container-wfx">
        <SectionLabel index="05" label={t("WOLFEX // Motor")} meta={t("Lifestyle extension")} />
      </div>

      {/* Scroll-driven kinetic type */}
      <div className="mt-14 space-y-1 md:mt-20" aria-hidden="true">
        <motion.p style={{ x: lineA }} className="whitespace-nowrap type-display text-[clamp(3rem,10vw,10rem)] text-outline">
          Built for speed · Built for speed · Built for speed
        </motion.p>
        <motion.p style={{ x: lineB }} className="whitespace-nowrap type-display text-[clamp(3rem,10vw,10rem)] text-outline-volt">
          Designed for movement · Designed for movement
        </motion.p>
      </div>

      <div className="container-wfx mt-12 md:mt-16">
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]" data-cursor="view" data-cursor-label="Motor">
          <motion.div className="absolute inset-0" style={{ y: imgY, scale: imgScale }}>
            <Media slot={MEDIA.motor} sizes="100vw" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/30" />
          <div className="light-sweep absolute inset-0 overflow-hidden" />

          <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-10">
            <div className="flex justify-between type-label text-steel">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-arc" /> REC — Night drive 01</span>
              <span className="hidden sm:block">16:9 / RAW</span>
            </div>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <h2 id="motor-title" className="type-display text-[clamp(2.5rem,7vw,6.5rem)] leading-[0.85]">
                WOLFEX <span className="text-arc">//</span> Motor
              </h2>
              <p className="max-w-xs type-title text-sm leading-relaxed text-bone/80">{t("Built for speed. Designed for movement.")}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 border-t border-line md:grid-cols-4">
          {SPECS.map((s, i) => (
            <Reveal key={s.k} delay={i * 0.08} className="border-b border-line py-5 pr-4 md:border-b-0 md:border-r md:last:border-r-0 md:[&:not(:first-child)]:pl-6">
              <p className="type-label text-steel">{s.k}</p>
              <p className="mt-2 type-title text-sm">{s.v}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 max-w-xl">
          <p className="type-body text-steel">
            Same instinct, different terrain. WOLFEX // MOTOR is where the pack meets the road — night drives, track days and
            capsule collections built around machines that move like we train.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
