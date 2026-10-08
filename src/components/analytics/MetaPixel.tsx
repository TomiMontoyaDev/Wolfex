"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { trackPageView } from "@/lib/meta-pixel";
import { ensureVisitorId } from "@/lib/visitor";

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

  // Crea el id anónimo del visitante en la primera visita (lo usan los eventos de la API de Conversiones).
  useEffect(() => {
    ensureVisitorId();
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    trackPageView();
  }, [pathname, searchParams]);

  return null;
}
