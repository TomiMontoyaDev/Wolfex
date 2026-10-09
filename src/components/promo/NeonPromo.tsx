"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { COMBO_TIERS } from "@/config/combos";
import { NEON_PROMO } from "@/config/promo";
import { FREE_SHIPPING_NATIONAL_MIN, FREE_SHIPPING_PEREIRA_MIN, LOCAL_CITY } from "@/config/shipping";
import { trackCustom } from "@/lib/meta-pixel";
import { formatPrice } from "@/lib/utils";
import { NeonScene, WantedStars } from "./NeonScene";

/** Título con efecto glitch neón (dos copias desfasadas en rosa y cian). */
export function GlitchTitle({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <span className="relative z-10 bg-[linear-gradient(180deg,#fff7c2_0%,#ffd84a_40%,#ff2e88_100%)] bg-clip-text text-transparent [filter:drop-shadow(0_0_18px_rgba(255,46,136,0.75))]">{text}</span>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 text-[#ff2e88] opacity-70 mix-blend-screen"
        animate={{ x: [0, -3, 2, 0, 0], opacity: [0, 0.8, 0.6, 0, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.04, 0.08, 0.12, 1] }}
      >
        {text}
      </motion.span>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 text-[#00e1ff] opacity-70 mix-blend-screen"
        animate={{ x: [0, 3, -2, 0, 0], opacity: [0, 0.8, 0.6, 0, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.05, 0.09, 0.13, 1], delay: 0.05 }}
      >
        {text}
      </motion.span>
    </span>
  );
}

/**
 * Campaña neón: escena + misiones (niveles reales del combo) + envío gratis.
 * `section` = bloque del inicio (lleva a /promo) · `page` = encabezado de la página /promo (h1).
 */
export function NeonPromo({ variant = "section" }: { variant?: "section" | "page" }) {
  if (!NEON_PROMO.active) return null;
  const Title = variant === "page" ? motion.h1 : motion.h2;
  return (
    <section id="nueva-era" className={`relative isolate overflow-hidden bg-[#12002b] ${variant === "page" ? "pt-[var(--nav-h)]" : ""}`} aria-labelledby="neon-title">
      <div className="relative">
        <NeonScene />
        <div className="container-wfx relative z-10 flex flex-col items-center pt-16 text-center md:pt-20">
          <motion.p
            className="border border-[#ff2e88]/60 bg-black/30 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[#ffd84a] backdrop-blur-sm"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {NEON_PROMO.eyebrow}
          </motion.p>
          <Title
            id="neon-title"
            className="mt-5 type-display italic leading-[0.85] tracking-tight text-[clamp(3.6rem,13vw,10rem)]"
            initial={{ opacity: 0, scale: 1.25, filter: "blur(14px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlitchTitle text={NEON_PROMO.title} />
          </Title>
          <motion.p
            className="mt-2 bg-black/40 px-3 py-1 font-mono text-sm uppercase tracking-[0.5em] text-[#00e1ff] [text-shadow:0_0_12px_rgba(0,225,255,0.9)] md:text-base"
            initial={{ opacity: 0, letterSpacing: "1.2em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.5em" }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.3 }}
          >
            {NEON_PROMO.subtitle}
          </motion.p>

          {/* Misiones = niveles reales del combo */}
          <div className="mt-8 grid w-full max-w-3xl grid-cols-3 gap-1.5 sm:gap-2.5">
            {COMBO_TIERS.map((tier, i) => (
              <motion.div
                key={tier.minItems}
                className="border border-white/15 bg-black/45 px-2 py-2.5 text-left backdrop-blur-md sm:px-4 sm:py-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.12 }}
              >
                <div className="flex flex-col-reverse items-start justify-between gap-1 sm:flex-row sm:items-center">
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-white/60 sm:text-[0.6rem]">Misión {i + 1}</span>
                  <WantedStars lit={i + 1} />
                </div>
                <p className="mt-1.5 type-title text-[0.65rem] leading-tight text-white sm:text-sm">
                  {tier.minItems}
                  {i === COMBO_TIERS.length - 1 ? "+" : ""} productos<span className="hidden sm:inline"> distintos</span>
                </p>
                <p className="font-mono text-sm text-[#ffd84a] sm:text-lg">hasta −{tier.percent}%</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-3 max-w-xl bg-black/45 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm">
            🚚 Envío GRATIS en {LOCAL_CITY} desde {formatPrice(FREE_SHIPPING_PEREIRA_MIN)} y a toda Colombia desde {formatPrice(FREE_SHIPPING_NATIONAL_MIN)}. El descuento se aplica solo en el carrito.
          </p>
          <div className="mt-6 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <motion.a
              href={variant === "page" ? "#ofertas" : NEON_PROMO.href}
              onClick={() => trackCustom("NeonPromoClick", { place: variant })}
              className="pointer-events-auto inline-flex w-full items-center justify-center gap-3 bg-[linear-gradient(90deg,#ff2e88,#ff8a3d)] px-6 py-4 type-title text-sm text-white sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              animate={{ boxShadow: ["0 0 25px rgba(255,46,136,0.45)", "0 0 55px rgba(255,46,136,0.85)", "0 0 25px rgba(255,46,136,0.45)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {variant === "page" ? "Ver las ofertas" : "Ver toda la promo"} <ArrowRight className="h-4 w-4" />
            </motion.a>
            <a
              href="/#combos"
              className="pointer-events-auto inline-flex w-full items-center justify-center gap-2 border border-[#00e1ff]/70 bg-black/40 px-6 py-4 type-title text-sm text-[#00e1ff] backdrop-blur-sm transition-colors hover:bg-[#00e1ff] hover:text-black sm:w-auto"
            >
              Aceptar misión: armar combo
            </a>
          </div>

          {/* Productos flotando sobre el horizonte (debajo del botón: nunca tapan el texto). */}
          <div className="mt-8 flex items-end justify-center gap-[3vw] pb-[6vh] md:gap-8">
            {NEON_PROMO.skus.map((sku, i) => (
              <motion.div
                key={sku}
                className={`relative ${i === 1 || i === 2 ? "w-[26vw] max-w-[150px]" : "w-[20vw] max-w-[115px]"} ${i === 3 ? "max-sm:hidden" : ""}`}
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div animate={{ y: [0, -12, 0], rotate: [i % 2 ? 3 : -3, i % 2 ? -2 : 2, i % 2 ? 3 : -3] }} transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}>
                  <Image src={`/images/promo/${sku.toLowerCase()}.png`} alt="" width={300} height={300} className="h-auto w-full drop-shadow-[0_0_25px_rgba(255,46,136,0.55)]" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
