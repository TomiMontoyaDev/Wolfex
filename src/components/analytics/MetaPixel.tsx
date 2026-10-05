"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { trackPixel } from "@/lib/meta-pixel";

/**
 * PageView en las navegaciones internas: Next cambia de página sin recargar, así que el código base
 * solo registraría la primera. La primera vista ya la envía el código base.
 */
export function MetaPixelPageViews() {
  // useSearchParams necesita Suspense para no volver dinámicas las páginas estáticas.
  return (
    <Suspense fallback={null}>
      <RouteChangePageView />
    </Suspense>
  );
}

function RouteChangePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    trackPixel("PageView");
  }, [pathname, searchParams]);

  return null;
}
