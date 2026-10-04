import Link from "next/link";
import type { ReactNode } from "react";

export interface InfoSection {
  title: string;
  /** Párrafos o listas. En el texto, `[COMPLETAR …]` se resalta para que se vea qué falta definir. */
  body: Array<string | string[]>;
}

// Sin /g en el test: una regex global guarda lastIndex entre llamadas y falla de forma intermitente.
const PENDING_SPLIT = /(\[COMPLETAR[^\]]*\])/;
const IS_PENDING = /^\[COMPLETAR[^\]]*\]$/;

/** Resalta los textos pendientes `[COMPLETAR …]`. */
function Text({ value }: { value: string }) {
  return (
    <>
      {value.split(PENDING_SPLIT).map((part, i) =>
        IS_PENDING.test(part) ? (
          <mark key={i} className="bg-amber-300/15 px-1 font-mono text-[0.85em] text-amber-200">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

const LINKS = [
  { href: "/envios", label: "Envíos" },
  { href: "/devoluciones", label: "Devoluciones" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/contacto", label: "Contacto" },
  { href: "/privacidad", label: "Privacidad" },
];

/** Plantilla de las páginas informativas (envíos, devoluciones, FAQ, contacto, privacidad). */
export function InfoPage({ eyebrow, title, intro, sections, current, children }: { eyebrow: string; title: string; intro: string; sections: InfoSection[]; current: string; children?: ReactNode }) {
  return (
    <main className="min-h-screen bg-void pb-24 pt-[calc(var(--nav-h)+var(--bar-h)+3rem)] md:pt-[calc(var(--nav-h)+var(--bar-h)+5rem)]">
      <div className="container-wfx grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-20">
        <nav aria-label="Información" className="order-2 lg:order-1">
          <p className="type-label text-steel">Información</p>
          <ul className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:border-l lg:border-line">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={link.href === current ? "page" : undefined}
                  className={
                    link.href === current
                      ? "block border border-arc px-3 py-2 type-label text-arc lg:-ml-px lg:border-0 lg:border-l lg:pl-4"
                      : "block border border-line-strong px-3 py-2 type-label text-steel transition-colors hover:text-bone lg:border-0 lg:pl-4"
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="order-1 max-w-3xl lg:order-2">
          <p className="type-label text-arc">{eyebrow}</p>
          <h1 className="mt-3 type-display text-[clamp(2.75rem,8vw,6rem)] leading-[0.9]">{title}</h1>
          <p className="mt-6 text-base leading-relaxed text-bone/85">
            <Text value={intro} />
          </p>
          {children}
          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="type-title text-lg text-bone">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-steel">
                  {section.body.map((block, i) =>
                    Array.isArray(block) ? (
                      <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-arc">
                        {block.map((item) => (
                          <li key={item}>
                            <Text value={item} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p key={i}>
                        <Text value={block} />
                      </p>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
