import Link from "next/link";
import type { ReactNode } from "react";

export interface InfoSection {
  title: string;
  /** Párrafos (texto o contenido con enlaces) o listas (arreglo de ítems). */
  body: Array<ReactNode | ReactNode[]>;
}

/** Enlace dentro de los textos informativos (WhatsApp, correo, otras páginas). */
export function InfoLink({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:/.test(href);
  return (
    <a href={href} className="text-arc underline-offset-4 hover:underline" {...(external && { target: "_blank", rel: "noreferrer" })}>
      {children}
    </a>
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
          <p className="mt-6 text-base leading-relaxed text-bone/85">{intro}</p>
          {children}
          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="type-title text-lg text-bone">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-steel">
                  {section.body.map((block, i) =>
                    Array.isArray(block) ? (
                      <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-arc">
                        {block.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p key={i}>{block}</p>
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
