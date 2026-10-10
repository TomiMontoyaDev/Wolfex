"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackCustom } from "@/lib/meta-pixel";
import { whatsappLink } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Botón flotante de WhatsApp (abajo a la izquierda, para no chocar con el "subir" del catálogo).
 * En computador muestra "Asesoría gratis"; en celular solo el ícono. Aparece tras bajar un poco.
 */
export function WhatsAppButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // En el checkout el cliente ya está comprando: no se le distrae.
  if (pathname === "/checkout") return null;

  return (
    <motion.a
      href={whatsappLink("Hola WOLFEX, quiero asesoría para elegir mis suplementos")}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackCustom("WhatsAppClick", { page: pathname })}
      aria-label="Asesoría gratis por WhatsApp"
      // En la ficha de producto (celular) sube por encima de la barra fija de compra.
      className={cn(
        "fixed left-4 z-40 flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-3 text-sm font-semibold text-[#062b14] shadow-[0_10px_30px_-8px_rgba(37,211,102,0.6)] md:bottom-6 md:left-6 md:px-4",
        pathname.startsWith("/producto/") ? "bottom-24" : "bottom-5",
      )}
      initial={false}
      animate={visible ? { opacity: 1, y: 0, pointerEvents: "auto" } : { opacity: 0, y: 16, pointerEvents: "none" }}
      transition={{ duration: 0.3 }}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
      </svg>
      <span className="hidden md:inline">Asesoría gratis</span>
    </motion.a>
  );
}
