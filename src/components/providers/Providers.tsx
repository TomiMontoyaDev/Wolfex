"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { CartProvider } from "./CartProvider";
import { IntroProvider } from "./IntroProvider";
import { LanguageProvider } from "./LanguageProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.16, 1, 0.3, 1] }}>
      <LanguageProvider>
        <IntroProvider>
          <CartProvider>{children}</CartProvider>
        </IntroProvider>
      </LanguageProvider>
    </MotionConfig>
  );
}
