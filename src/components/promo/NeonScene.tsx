"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SUN_MASK = "linear-gradient(180deg,#000 55%,transparent 55%),repeating-linear-gradient(180deg,#000 0 12px,transparent 12px 19px)";

/**
 * Escena neón retro: cielo de atardecer, sol con franjas, palmeras que se mecen, cuadrícula que avanza
 * y productos flotando. Solo transform/opacity (liviano en celulares); con "reducir movimiento" queda quieta.
 */
export function NeonScene({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {/* Cielo */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#12002b_0%,#3b0a5c_32%,#b0156b_55%,#ff6a3d_72%,#ffb347_80%,#12002b_80.5%)]" />
      {/* Estrellas */}
      {!compact &&
        Array.from({ length: 24 }, (_, i) => (
          <motion.span
            key={i}
            className="absolute h-[2px] w-[2px] rounded-full bg-white"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 17) % 40}%` }}
            animate={{ opacity: [0.15, 1, 0.15] }}
            transition={{ duration: 2 + (i % 5) * 0.6, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      {/* Sol con franjas */}
      <motion.div
        className="absolute left-1/2 top-[30%] aspect-square w-[min(62vw,440px)] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#ffe25a_0%,#ff8a3d_45%,#ff2e88_100%)] shadow-[0_0_120px_40px_rgba(255,64,140,0.45)]"
        // Mitad de arriba sólida + franjas abajo (sol "synthwave").
        style={{ maskImage: SUN_MASK, WebkitMaskImage: SUN_MASK }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Cuadrícula retro que avanza */}
      <div className="absolute inset-x-0 bottom-0 h-[20%] overflow-hidden [perspective:300px]">
        <motion.div
          className="absolute inset-x-[-50%] top-0 h-[300%] origin-top [transform:rotateX(62deg)]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,46,136,0.85) 2px,transparent 2px),linear-gradient(90deg,rgba(0,200,255,0.75) 2px,transparent 2px)",
            backgroundSize: "60px 60px",
          }}
          animate={{ backgroundPositionY: ["0px", "60px"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#12002b] via-transparent to-transparent" />
      </div>
      {/* Palmeras */}
      <Palm className={cn("absolute bottom-[18%] left-[-4%] origin-bottom", compact ? "h-[34%] left-[-10%]" : "h-[62%]")} delay={0} />
      <Palm className={cn("absolute bottom-[18%] left-[9%] h-[44%] origin-bottom", compact && "hidden")} delay={1.2} small />
      <Palm className={cn("absolute bottom-[18%] right-[-4%] origin-bottom -scale-x-100", compact ? "h-[36%] right-[-10%]" : "h-[66%]")} delay={0.6} />
      {!compact && <Palm className="absolute bottom-[18%] right-[11%] h-[40%] origin-bottom -scale-x-100" delay={1.8} small />}
      {/* Líneas de TV (scanlines) */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.18)_0_1px,transparent_1px_3px)] mix-blend-multiply" />
    </div>
  );
}

function Palm({ className, delay, small = false }: { className?: string; delay: number; small?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 400"
      className={className}
      animate={{ rotate: [-1.5, 1.5, -1.5] }}
      transition={{ duration: small ? 4 : 5.5, repeat: Infinity, ease: "easeInOut", delay }}
      fill="#0b0018"
    >
      <path d="M96 400 C100 300 92 220 112 120 L120 122 C104 220 112 300 110 400 Z" />
      <g transform="translate(114 118)">
        <path d="M0 0 C-30 -30 -80 -30 -110 0 C-80 -12 -40 -10 0 6Z" />
        <path d="M0 0 C20 -40 70 -50 100 -26 C70 -24 34 -14 2 8Z" />
        <path d="M0 0 C-10 -45 -50 -75 -86 -70 C-56 -56 -26 -34 -4 4Z" />
        <path d="M0 0 C16 -48 50 -76 84 -78 C58 -58 30 -34 4 4Z" />
        <path d="M0 2 C-36 -6 -84 18 -96 54 C-68 30 -36 18 0 10Z" />
        <path d="M2 2 C40 -2 84 24 92 60 C66 34 36 20 2 10Z" />
      </g>
    </motion.svg>
  );
}

/** Estrellas de "nivel": se encienden una tras otra (niveles de combo). */
export function WantedStars({ lit, total = 3, className }: { lit: number; total?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-1", className)} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 sm:h-5 sm:w-5"
          initial={{ scale: 0.6, opacity: 0.3 }}
          whileInView={{ scale: i < lit ? [0.6, 1.35, 1] : 0.85, opacity: i < lit ? 1 : 0.3 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.25 }}
        >
          <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5-4.9-4.6 6.6-.8z" fill={i < lit ? "#ffd84a" : "transparent"} stroke="#ffd84a" strokeWidth="1.5" />
        </motion.svg>
      ))}
    </span>
  );
}
