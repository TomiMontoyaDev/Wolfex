"use client";

import { motion, type MotionValue } from "framer-motion";
import { Media } from "@/components/ui/Media";
import type { Product } from "@/data/products";
import { cn, formatPrice } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Fotos de productos reales a los lados del hero: dejan claro al instante que WOLFEX vende suplementos.
 * Computador: dos a cada lado. Celular: una a cada lado, más pequeñas, por encima del lobo.
 * Cada foto lleva al producto en el catálogo.
 */
const SLOTS = [
  { side: "left", className: "left-[7%] top-[19%] w-[clamp(110px,11vw,190px)] -rotate-[7deg]", mobile: true, float: 0 },
  { side: "right", className: "right-[7%] top-[17%] w-[clamp(110px,11vw,190px)] rotate-[6deg]", mobile: true, float: 1.2 },
  // Las de abajo, solo en pantallas con alto suficiente (si no, chocan con la palabra WOLFEX).
  { side: "left", className: "left-[19%] top-[34%] w-[clamp(90px,7.5vw,130px)] rotate-[5deg] [@media(max-height:760px)]:hidden", mobile: false, float: 0.6 },
  { side: "right", className: "right-[19%] top-[33%] w-[clamp(90px,7.5vw,130px)] -rotate-[5deg] [@media(max-height:760px)]:hidden", mobile: false, float: 1.8 },
] as const;

// En celular: arriba en las esquinas, sin tapar el lobo ni los textos.
const MOBILE = { left: "max-md:left-[-3%] max-md:top-[15%] max-md:w-[27vw]", right: "max-md:right-[-3%] max-md:top-[15%] max-md:w-[27vw]" };

export function HeroProducts({ products, ready, x, y }: { products: Product[]; ready: boolean; x: MotionValue<number>; y: MotionValue<number> }) {
  const shown = products.filter((product) => product.images.primary.ready).slice(0, SLOTS.length);
  if (!shown.length) return null;

  return (
    <motion.div className="pointer-events-none absolute inset-0 z-[5]" style={{ x, y }} aria-label="Productos destacados">
      {shown.map((product, index) => {
        const slot = SLOTS[index];
        return (
          <motion.a
            key={product.id}
            href={`/catalogo?q=${encodeURIComponent(product.name)}`}
            aria-label={`Ver ${product.name}`}
            className={cn("pointer-events-auto absolute block", slot.className, MOBILE[slot.side], !slot.mobile && "max-md:hidden")}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={ready ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.8 + index * 0.15, ease }}
          >
            {/* Flotan suave y desfasadas (solo transform: liviano en celulares). */}
            <motion.span
              className="group relative block"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: slot.float }}
            >
              <span className="absolute -inset-3 rounded-full bg-volt/25 blur-2xl" aria-hidden="true" />
              <span className="relative block aspect-square overflow-hidden rounded-md border border-arc/30 bg-ink shadow-[0_20px_60px_-20px_rgba(0,102,255,0.8)] transition-transform duration-500 group-hover:scale-105">
                <Media slot={product.images.primary} sizes="(max-width: 768px) 30vw, 210px" priority={index < 2} />
              </span>
              <span className="relative mt-2 hidden truncate text-center font-mono text-[0.65rem] text-bone/80 md:block">{formatPrice(product.price)}</span>
            </motion.span>
          </motion.a>
        );
      })}
    </motion.div>
  );
}
