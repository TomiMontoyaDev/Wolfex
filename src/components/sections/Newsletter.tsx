"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Status = "idle" | "loading" | "success" | "error";

export function Newsletter() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const res = await subscribeToNewsletter(email.trim());
    if (res.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setError(res.message ?? "Something went wrong.");
    }
  };

  return (
    <section id="join" className="relative overflow-hidden border-t border-line bg-void py-28 md:py-44" aria-labelledby="join-title">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[80vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt/[0.08] blur-[140px]" />
      <div className="container-wfx relative flex flex-col items-center text-center">
        <p className="type-label text-arc">{t("Early access")}</p>
        <SplitReveal as="h2" text={t("Join the pack.")} className="mt-6 justify-center type-display text-[clamp(3rem,9vw,8.5rem)]" />
        <Reveal delay={0.2} className="w-full max-w-xl">
          <p id="join-title" className="mt-6 type-body text-steel">{t("Get early access to drops, exclusive releases and WOLFEX updates.")}</p>

          <form onSubmit={onSubmit} className="mt-12" noValidate>
            <AnimatePresence mode="wait" initial={false}>
              {status === "success" ? (
                <motion.div key="ok" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 border-b border-arc pb-4 type-title text-sm text-arc">
                  <Check className="h-4 w-4" /> {t("You're in. Welcome to the pack.")}
                </motion.div>
              ) : (
                <motion.div key="form" exit={{ opacity: 0, y: -12 }} className="group relative flex items-center border-b border-line-strong transition-colors focus-within:border-arc">
                  <label htmlFor="email" className="sr-only">{t("Email address")}</label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder={t("Email address").toUpperCase()}
                    className="h-16 flex-1 bg-transparent font-mono text-sm uppercase tracking-[0.14em] text-bone placeholder:text-steel focus:outline-none"
                  />
                  <button type="submit" disabled={status === "loading"} className="flex h-16 items-center gap-3 pl-4 type-title text-sm text-bone transition-colors hover:text-arc disabled:opacity-50" data-cursor="hover">
                    {status === "loading" ? "Joining…" : t("Join")}
                    <ArrowRight className="h-4 w-4 transition-transform duration-500 group-focus-within:translate-x-1" strokeWidth={1.5} />
                  </button>
                  <span className="absolute -bottom-px left-0 h-px w-0 bg-arc shadow-[0_0_12px_rgba(0,168,255,0.9)] transition-[width] duration-700 ease-[var(--ease-apex)] group-focus-within:w-full" />
                </motion.div>
              )}
            </AnimatePresence>
            <p className="mt-4 h-4 type-label text-steel" role="status">
              {status === "error" ? <span className="text-arc">{error}</span> : t("No spam. Only drops. Unsubscribe anytime.")}
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
