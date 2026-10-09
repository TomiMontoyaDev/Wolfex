"use client";

import { motion } from "framer-motion";
import { Media } from "@/components/ui/Media";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { CATEGORIES } from "@/data/site";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Editorial asymmetric layout (desktop):
 *   ┌───────────────┬───────────────┐
 *   │  SUPPLEMENTS  │   PROTEINS    │
 *   │               │               │
 *   └───────────────┴───────────────┘
 * Mobile: full-bleed stacked panels with persistent labels.
 */
const LAYOUT: Record<string, string> = {
  supplements: "lg:col-span-6 aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto",
  proteins: "lg:col-span-6 aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto",
};

export function Categories() {
  const { t } = useLanguage();
  return (
    <section id="categories" className="relative bg-void py-28 md:py-40" aria-labelledby="cat-title">
      <div className="container-wfx">
        <SectionLabel index="05" label={t("Categories")} meta={`02 ${t("categories")}`} />
        <div className="mt-12 flex flex-col justify-between gap-6 md:mt-16 md:flex-row md:items-end">
          <SplitReveal as="h2" text={t("Find your wolf")} className="type-display text-[clamp(2rem,10.5vw,8.5rem)]" />
          <p className="max-w-xs type-label text-steel md:pb-4 md:text-right">{t("Supplements")} / {t("Proteins")}</p>
        </div>

        <div className="mt-12 grid gap-3 md:mt-16 lg:grid-cols-12 lg:gap-4" id="cat-title">
          {CATEGORIES.map((c, i) => (
            <motion.a
              key={c.id}
              href={c.href}
              className={cn("group relative block overflow-hidden bg-ink", LAYOUT[c.id])}
              data-cursor="view"
              data-cursor-label="Explore"
              initial={{ opacity: 0, clipPath: "inset(12% 0 0 0)" }}
              whileInView={{ opacity: 1, clipPath: "inset(0% 0 0 0)" }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 1.3, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[var(--ease-apex)] group-hover:scale-[1.07]">
                <Media slot={c.media} sizes="(min-width:1024px) 50vw, 100vw" />
              </div>
              {/* overlay: darkens at rest, opens to blue on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-void/10 transition-opacity duration-700 group-hover:opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-tr from-volt/25 via-volt/5 to-transparent opacity-0 mix-blend-screen transition-opacity duration-700 group-hover:opacity-100" />
              <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(245,247,250,0.06)] transition-shadow duration-700 group-hover:shadow-[inset_0_0_0_1px_rgba(0,168,255,0.45)]" />

              <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-8">
                <div className="flex justify-between type-label">
                  <span className="text-arc">{c.index}</span>
                  <span className="text-steel">WFX / {c.id.toUpperCase()}</span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className="transition-transform duration-700 ease-[var(--ease-apex)] group-hover:-translate-y-2">
                    <p className="type-label text-steel">{t(c.caption)}</p>
                    <h3 className="mt-2 type-display text-[clamp(1.75rem,8.4vw,3rem)] lg:text-[clamp(2.25rem,4.2vw,4.5rem)] leading-[0.85]">{t(c.title)}</h3>
                  </div>
                  <span className="flex items-center gap-2 overflow-hidden type-title text-xs text-arc lg:translate-y-4 lg:opacity-0 lg:transition-[transform,opacity] lg:duration-500 lg:ease-[var(--ease-apex)] lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                    {t("Explore")} <span aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
