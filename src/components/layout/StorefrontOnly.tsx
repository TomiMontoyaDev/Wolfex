"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Renders storefront chrome (navbar, cart, footer, loader, cursor) everywhere except the admin panel. */
export function StorefrontOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname?.startsWith("/admin/")) return null;
  return <>{children}</>;
}
