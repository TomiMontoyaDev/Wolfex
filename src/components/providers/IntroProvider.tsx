"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface IntroState {
  /** True once the loading screen has finished — hero entrance waits for this. */
  ready: boolean;
  markReady: () => void;
}

const IntroContext = createContext<IntroState>({ ready: true, markReady: () => {} });

export function IntroProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  return <IntroContext.Provider value={{ ready, markReady }}>{children}</IntroContext.Provider>;
}

export const useIntro = () => useContext(IntroContext);
