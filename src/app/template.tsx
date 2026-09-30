"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Route-level transition — every navigation fades/rises in. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}
