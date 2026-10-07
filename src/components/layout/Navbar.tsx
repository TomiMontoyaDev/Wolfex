"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useIntro } from "@/components/providers/IntroProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { WolfMark, Wordmark } from "@/components/visuals/WolfMark";
import { NAV_LINKS, SITE, SOCIALS } from "@/data/site";
import { CONTACT } from "@/lib/site-config";
import { AnnouncementBar } from "./AnnouncementBar";
import { SearchOverlay } from "./SearchOverlay";
import { cn, pad } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { ready } = useIntro();
  const cart = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  // Atajo de teclado: Ctrl+K / ⌘K abre el buscador.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  useEffect(() => {
    if (!menuOpen) return;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: ready ? 0 : -100, opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
      >
        {/* Se recoge al hacer scroll o abrir el menú para no robar espacio. */}
        <AnnouncementBar hidden={scrolled || menuOpen} />
        <div
          className={cn(
            "border-b transition-[background-color,border-color,backdrop-filter] duration-500",
            scrolled || menuOpen ? "border-volt/15 bg-void/70 backdrop-blur-xl" : "border-transparent bg-transparent",
          )}
        >
          <nav className="container-wfx flex h-[var(--nav-h)] items-center justify-between" aria-label="Main">
            {/* Mobile: menu trigger */}
            <button
              className="-ml-2 flex h-11 w-11 items-center justify-center min-[1360px]:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            </button>

            <a
              href="/"
              onClick={(event) => {
                if (pathname === "/") return;
                event.preventDefault();
                router.push("/");
              }}
              className="group flex shrink-0 items-center gap-3 max-[1359px]:absolute max-[1359px]:left-1/2 max-[1359px]:-translate-x-1/2"
              aria-label="WOLFEX home"
            >
              <WolfMark outline className="h-7 w-auto text-bone transition-colors duration-500 group-hover:text-arc md:h-8" />
              <Wordmark className="h-[15px] w-auto text-bone md:h-[18px]" title="" />
            </a>

            {/* 7 enlaces: en línea solo en pantallas anchas; por debajo van en el menú (☰). */}
            <ul className="hidden items-center gap-6 min-[1360px]:flex 2xl:gap-9">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href.startsWith("/") ? l.href : pathname === "/" ? l.href : `/${l.href}`}
                    onClick={(event) => {
                      // Rutas (/catalogo…): navegación instantánea. Anclas (#…): scroll nativo en el inicio.
                      if (!l.href.startsWith("/") && pathname === "/") return;
                      event.preventDefault();
                      router.push(l.href.startsWith("/") ? l.href : `/${l.href}`);
                    }}
                    className="group relative block overflow-hidden whitespace-nowrap type-title text-[0.6875rem] text-bone/80 transition-colors hover:text-bone 2xl:text-[0.75rem]"
                  >
                    <span className="block transition-transform duration-500 ease-[var(--ease-apex)] group-hover:-translate-y-full">{t(l.label)}</span>
                    <span className="absolute inset-0 translate-y-full text-arc transition-transform duration-500 ease-[var(--ease-apex)] group-hover:translate-y-0">{t(l.label)}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="-mr-2 flex items-center">
              <IconButton label={t("Search")} onClick={openSearch} className="hidden sm:flex">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </IconButton>
              {/* Acceso al panel: /admin redirige al login si no hay sesión. */}
              <a href="/admin" aria-label={t("Account")} className="relative hidden h-11 w-11 items-center justify-center text-bone/85 transition-colors hover:text-arc sm:flex">
                <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </a>
              <a
                href={CONTACT.instagram.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram de WOLFEX"
                // Oculto en celular: el logo centrado se montaba encima (Instagram sigue en el menú ☰).
                className="hidden h-11 w-11 items-center justify-center text-bone/85 transition-colors hover:text-arc sm:flex"
              >
                <SocialIcon platform="instagram" className="h-[18px] w-[18px]" />
              </a>
              <IconButton label={`Cart, ${cart.count} items`} onClick={cart.open}>
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
                <AnimatePresence>
                  {cart.count > 0 && (
                    <motion.span
                      key={cart.pulse}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-volt px-1 font-mono text-[9px] font-semibold text-bone shadow-[0_0_10px_rgba(0,102,255,0.9)]"
                    >
                      {cart.count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </IconButton>
              <button
                type="button"
                onClick={() => setLanguage(language === "en" ? "es" : "en")}
                className="ml-1 h-11 min-w-11 border-l border-line px-2 type-label text-[0.65rem] text-bone/80 transition-colors hover:text-arc"
                aria-label={language === "en" ? "Cambiar a español" : "Switch to English"}
              >
                {language === "en" ? "ES" : "EN"}
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSearch={openSearch} />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}

function IconButton({ children, label, onClick, className }: { children: React.ReactNode; label: string; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} aria-label={label} className={cn("relative flex h-11 w-11 items-center justify-center text-bone/85 transition-colors hover:text-arc", className)}>
      {children}
    </button>
  );
}

/** Mobile: full-screen editorial menu — not a shrunken desktop nav. */
function MobileMenu({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const { t } = useLanguage();
  const router = useRouter();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-void pt-[var(--nav-h)] min-[1360px]:hidden"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-volt/20 blur-[120px]" />
          <div className="container-wfx flex flex-1 flex-col justify-between pb-8 pt-6">
            <div>
              <p className="type-label text-steel">{t("Menu")} — 0{NAV_LINKS.length}</p>
              <ul className="mt-6 border-t border-line">
                {NAV_LINKS.map((l, i) => (
                  <li key={l.label} className="overflow-hidden border-b border-line">
                    <motion.a
                      href={l.href.startsWith("/") ? l.href : `/${l.href}`}
                      onClick={(event) => {
                        onClose();
                        // Anclas (#…) en el inicio: scroll nativo. Lo demás: navegación instantánea.
                        if (!l.href.startsWith("/") && window.location.pathname === "/") return;
                        event.preventDefault();
                        router.push(l.href.startsWith("/") ? l.href : `/${l.href}`);
                      }}
                      className="flex items-baseline justify-between gap-4 py-3"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.7, delay: 0.25 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="type-headline text-[clamp(1.6rem,7.5vw,3rem)]">{t(l.label)}</span>
                      <span className="type-label text-arc">{pad(i + 1)}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={onSearch} className="flex h-12 flex-1 items-center justify-center gap-2 border border-line-strong type-title text-xs"><Search className="h-4 w-4" strokeWidth={1.5} />{t("Search")}</button>
                <a href="/admin" onClick={onClose} className="flex h-12 flex-1 items-center justify-center gap-2 border border-line-strong type-title text-xs"><User className="h-4 w-4" strokeWidth={1.5} />{t("Account")}</a>
              </div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-end justify-between">
              <div>
                <p className="type-title text-sm text-arc">{SITE.tagline}</p>
                <p className="mt-1 type-label text-steel">EST. {SITE.established} · WFX</p>
              </div>
              <div className="flex gap-1">
                {SOCIALS.map((s) => (
                  <a key={s.platform} href={s.href} aria-label={s.label} className="flex h-11 w-11 items-center justify-center text-bone/70" target="_blank" rel="noreferrer">
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
