"use client";

import { motion, type MotionValue } from "framer-motion";
import Image from "next/image";
import { HERO_SKUS } from "@/config/hero";
import type { Product } from "@/data/products";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Productos reales (PNG sin fondo) a los lados del hero: dejan claro al instante que WOLFEX vende suplementos.
 * Los recortes viven en /public/images/hero/<sku>.png. Si un producto se agota o se desactiva, no se muestra.
 * Computador: dos a cada lado. Celular: los dos primeros, en las esquinas de arriba.
 */
// Posición de cada producto de HERO_SKUS (src/config/hero.ts), en el mismo orden.
const SLOTS = [
  { side: "left", className: "left-[6%] top-[17%] w-[clamp(100px,9.5vw,160px)] -rotate-[8deg]", mobile: true, float: 0 },
  { side: "right", className: "right-[6%] top-[16%] w-[clamp(105px,10vw,170px)] rotate-[7deg]", mobile: true, float: 1.2 },
  // Las de abajo, solo en pantallas con alto suficiente (si no, chocan con la palabra WOLFEX).
  { side: "left", className: "left-[19%] top-[33%] w-[clamp(80px,6.5vw,112px)] rotate-[6deg] [@media(max-height:760px)]:hidden", mobile: false, float: 0.6 },
  { side: "right", className: "right-[19%] top-[32%] w-[clamp(72px,5.5vw,100px)] -rotate-[6deg] [@media(max-height:760px)]:hidden", mobile: false, float: 1.8 },
] as const;

// En celular: arriba en las esquinas, sin tapar el lobo ni los textos.
const MOBILE = { left: "max-md:left-[2%] max-md:top-[14%] max-md:w-[20vw]", right: "max-md:right-[2%] max-md:top-[14%] max-md:w-[22vw]" };

export function HeroProducts({ products, ready, x, y }: { products: Product[]; ready: boolean; x: MotionValue<number>; y: MotionValue<number> }) {
  const shown = HERO_SKUS.flatMap((sku, index) => {
    const product = products.find((item) => item.sku === sku && item.available);
    return product ? [{ slot: SLOTS[index], sku, product }] : [];
  });
  if (!shown.length) return null;

  return (
    <motion.div className="pointer-events-none absolute inset-0 z-[5]" style={{ x, y }}>
      {shown.map(({ slot, sku, product }, index) => (
        <motion.a
          key={product.id}
          href={`/catalogo?q=${encodeURIComponent(product.name)}`}
          aria-label={`Ver ${product.name}`}
          className={cn("pointer-events-auto absolute block", slot.className, MOBILE[slot.side], !slot.mobile && "max-md:hidden")}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={ready ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.8 + index * 0.15, ease }}
        >
          {/* Flotan suave y desfasados (solo transform: liviano en celulares). */}
          <motion.span
            className="group relative block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: slot.float }}
          >
            <span className="absolute inset-[12%] rounded-full bg-volt/35 blur-3xl" aria-hidden="true" />
            <Image
              src={`/images/hero/${sku.toLowerCase()}.png`}
              alt={product.name}
              width={520}
              height={520}
              sizes="(max-width: 768px) 22vw, 170px"
              priority={index < 2}
              className="relative h-auto w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-105"
            />
          </motion.span>
        </motion.a>
      ))}
    </motion.div>
  );
}
