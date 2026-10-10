"use client";

import { ArrowUp } from "lucide-react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { WolfMark, Wordmark } from "@/components/visuals/WolfMark";
import { FOOTER_LINKS, SITE, SOCIALS } from "@/data/site";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-void pt-20 md:pt-28">
      <div className="container-wfx">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-4">
              <WolfMark outline className="h-11 w-auto text-bone" />
              <div>
                <p className="type-title text-sm">{SITE.tagline}</p>
                <p className="mt-1 type-label text-steel">Desde {SITE.established} · Sistema de rendimiento</p>
              </div>
            </div>
            <p className="mt-8 max-w-sm type-body text-sm text-steel">{t(SITE.description)}</p>
          </div>

          <nav className="md:col-span-4" aria-label="Footer">
            <p className="type-label text-steel">{t("Navigate")}</p>
            <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3">
              {FOOTER_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="type-title text-sm text-bone/80 transition-colors hover:text-arc">{t(l.label)}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <p className="type-label text-steel">{t("Follow the pack")}</p>
            <ul className="mt-6 space-y-3">
              {SOCIALS.map((s) => (
                <li key={s.platform}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="group flex items-center gap-3 type-title text-sm text-bone/80 transition-colors hover:text-arc">
                    <SocialIcon platform={s.platform} className="h-4 w-4" />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Monumental wordmark */}
      <div className="relative mt-20 select-none md:mt-28" aria-hidden="true">
        <div className="container-wfx relative">
          <Wordmark variant="outline" className="h-auto w-full text-bone/25" title="" />
          <div className="pointer-events-none absolute inset-0 px-[var(--gutter)] text-volt/50 [mask-image:linear-gradient(to_bottom,black_5%,transparent_80%)]">
            <Wordmark className="h-auto w-full" title="" />
          </div>
        </div>
      </div>

      <div className="container-wfx flex flex-col-reverse items-start justify-between gap-6 border-t border-line py-6 sm:flex-row sm:items-center">
        <p className="type-label text-steel">© {SITE.established} {SITE.name}. Todos los derechos reservados.</p>
        <div className="flex items-center gap-8 type-label text-steel">
          <span className="hidden md:inline">WFX-SYS / v1.0</span>
          <a href="#top" className="group flex items-center gap-2 text-bone/80 hover:text-arc">
          {t("Back to top")} <ArrowUp className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}
