"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useIntro } from "@/components/providers/IntroProvider";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { NAV_LINKS, SITE, SOCIALS } from "@/data/site";
import { cn, pad } from "@/lib/utils";

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { ready } = useIntro();
  const cart = useCart();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

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
        <div
          className={cn(
            "border-b transition-[background-color,border-color,backdrop-filter] duration-500",
            scrolled || menuOpen ? "border-volt/15 bg-void/70 backdrop-blur-xl" : "border-transparent bg-transparent",
          )}
        >
          <nav className="container-wfx flex h-[var(--nav-h)] items-center justify-between" aria-label="Main">
            {/* Mobile: menu trigger */}
            <button
              className="-ml-2 flex h-11 w-11 items-center justify-center lg:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            </button>

            <a href="#top" className="group flex items-center gap-3 max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2" aria-label="WOLFEX home">
              <span className="type-display text-xl tracking-[0.14em] md:text-[1.35rem]">{SITE.name}</span>
              <span className="hidden h-1.5 w-1.5 rotate-45 bg-volt transition-transform duration-500 group-hover:rotate-[225deg] md:block" />
            </a>

            <ul className="hidden items-center gap-10 lg:flex">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="group relative block overflow-hidden type-title text-[0.75rem] text-bone/80 transition-colors hover:text-bone">
                    <span className="block transition-transform duration-500 ease-[var(--ease-apex)] group-hover:-translate-y-full">{l.label}</span>
                    <span className="absolute inset-0 translate-y-full text-arc transition-transform duration-500 ease-[var(--ease-apex)] group-hover:translate-y-0">{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="-mr-2 flex items-center">
              <IconButton label="Search" className="hidden sm:flex">
                <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </IconButton>
              <IconButton label="Account" className="hidden sm:flex">
                <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </IconButton>
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
            </div>
          </nav>
        </div>
      </motion.header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
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
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col bg-void pt-[var(--nav-h)] lg:hidden"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-volt/20 blur-[120px]" />
          <div className="container-wfx flex flex-1 flex-col justify-between pb-8 pt-6">
            <div>
              <p className="type-label text-steel">Menu — 0{NAV_LINKS.length}</p>
              <ul className="mt-6 border-t border-line">
                {NAV_LINKS.map((l, i) => (
                  <li key={l.label} className="overflow-hidden border-b border-line">
                    <motion.a
                      href={l.href}
                      onClick={onClose}
                      className="flex items-baseline justify-between py-4"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.7, delay: 0.25 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="type-headline text-[clamp(2.25rem,11vw,3.5rem)]">{l.label}</span>
                      <span className="type-label text-arc">{pad(i + 1)}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-3">
                <a href="#" className="flex h-12 flex-1 items-center justify-center gap-2 border border-line-strong type-title text-xs"><Search className="h-4 w-4" strokeWidth={1.5} />Search</a>
                <a href="#" className="flex h-12 flex-1 items-center justify-center gap-2 border border-line-strong type-title text-xs"><User className="h-4 w-4" strokeWidth={1.5} />Account</a>
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
