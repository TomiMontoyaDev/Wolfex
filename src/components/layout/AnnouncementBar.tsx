"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SHIPPING_BAR_ITEMS } from "@/config/shipping";

/** Barra superior de envíos. Escritorio: los 3 mensajes en línea. Móvil: rotan uno a uno. */
export function AnnouncementBar({ hidden }: { hidden: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % SHIPPING_BAR_ITEMS.length), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="overflow-hidden bg-volt text-bone"
      initial={false}
      animate={{ height: hidden ? 0 : "var(--bar-h)" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden={hidden}
    >
      <div className="container-wfx flex h-[var(--bar-h)] items-center justify-center type-label text-[0.625rem] md:text-[0.6875rem]">
        <p className="hidden items-center gap-3 md:flex">
          {SHIPPING_BAR_ITEMS.map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-bone/60" aria-hidden="true" />}
              {item}
            </span>
          ))}
        </p>
        <div className="relative h-full w-full md:hidden" aria-live="off">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={index}
              className="absolute inset-0 flex items-center justify-center text-center"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {SHIPPING_BAR_ITEMS[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
