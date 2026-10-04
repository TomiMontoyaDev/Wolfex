"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "es";

const translations: Record<string, string> = {
  "Shop": "Tienda", "Men": "Hombre", "Women": "Mujer", "Accessories": "Accesorios", "Supplements": "Suplementos", "Proteins": "Proteínas", "Build your strength": "Construye tu fuerza", "Creatines": "Creatinas", "Pre-workout": "Pre-entreno", "Vitamins & wellness": "Vitaminas y bienestar", "About": "Nosotros", "The": "El", "Code": "Código", "categories": "categorías", "Menu": "Menú",
  "BUILT TO HUNT.": "HECHO PARA CAZAR.", "NO COMFORT.": "SIN COMODIDAD.", "BEYOND YOUR LIMITS.": "MÁS ALLÁ DE TUS LÍMITES.", "FIND YOUR WOLF.": "ENCUENTRA TU LOBO.", "HUNT YOUR APEX.": "ALCANZA TU CIMA.",
  "Search": "Buscar", "Account": "Cuenta", "Open menu": "Abrir menú", "Close menu": "Cerrar menú",
  "The WOLFEX Code": "El código WOLFEX", "Manifesto — WFX/M-01": "Manifiesto — WFX/M-01",
  "Three rules. No exceptions. Written for the ones who train when nobody is watching.": "Tres reglas. Sin excepciones. Escrito para quienes entrenan cuando nadie está mirando.",
  "WOLFEX is built for those who refuse to stay at the same level. We don't chase comfort. We chase the next version of ourselves.": "WOLFEX está hecho para quienes se niegan a quedarse en el mismo nivel. No perseguimos comodidad. Perseguimos la siguiente versión de nosotros mismos.",
  "Discipline": "Disciplina", "Comfort": "Comodidad", "Progress": "Progreso", "Excuses": "Excusas",
  "Instinct": "Instinto", "Hesitation": "Duda", "over": "sobre", "Hunt your apex.": "Alcanza tu cima.",
  "Collections": "Colecciones", "Categories": "Categorías", "Find your wolf": "Encuentra tu lobo", "Explore": "Explorar",
  "Built to hunt": "Hecho para cazar", "Beyond your limits": "Más allá de tus límites",
  "Shop supplements": "Ver suplementos", "Explore WOLFEX": "Explorar WOLFEX",
  "Performance supplements for those who refuse to stay at the same level.": "Suplementos de rendimiento para quienes se niegan a quedarse en el mismo nivel.",
  "SUPPLEMENTS": "SUPLEMENTOS", "Nationwide shipping — live": "Envío gratis desde $180.000", "Built for your progress": "Diseñado para tu progreso",
  "Campaign 01": "Campaña 01", "WOLFEX — Film / Photo": "WOLFEX — Video / Foto",
  "Shop all": "Ver todo", "Ver catálogo completo": "Ver catálogo completo", "Add to bag": "Añadir al carrito", "Added": "Añadido",
  "Built different.": "Hecho diferente.", "Performance isn't a destination.": "El rendimiento no es un destino.", "It's a standard.": "Es un estándar.",
  "Discover WOLFEX": "Descubre WOLFEX", "No comfort.": "Sin comodidad.", "Performance without limits.": "Rendimiento sin límites.",
  "Train": "Entrena", "Move": "Muévete", "Build": "Construye", "Repeat": "Repite", "Fuel": "Alimenta", "Recover": "Recupera", "Days a year": "Días al año", "Enfoque diario": "Enfoque diario", "Ritmo constante": "Ritmo constante", "Cada semana": "Cada semana",
  "Performance system": "Sistema de rendimiento", "Scroll": "Desplaza",
  "Show up when no one is watching. Especially then.": "Preséntate cuando nadie esté mirando. Especialmente entonces.",
  "Strength is built slowly, then all at once.": "La fuerza se construye lentamente, y luego de golpe.",
  "Discipline is a loop. Close it every single day.": "La disciplina es un ciclo. Ciérralo todos los días.",
  "Run with the pack.": "Entrena con la manada.", "Join WOLFEX": "Únete a WOLFEX", "Community": "Comunidad",
  "WOLFEX is bigger than a logo. It's the 5AM sessions, the late-night workouts, the people who push you past the point you would have stopped alone. Fuel up. Tag us. Train with us.": "WOLFEX es más que un logo. Son las sesiones de las 5 a.m., los entrenos de medianoche y las personas que te llevan más allá de donde te habrías detenido. Aliméntate bien. Etiquétanos. Entrena con nosotros.",
  "5AM crew": "Los de las 5 a.m.", "Night run": "Entreno nocturno", "Heavy day": "Día pesado", "Motor meet": "Encuentro Motor",
  "Offers, new arrivals & the pack in motion.": "Ofertas, productos nuevos y la manada en acción.",
  "Training tips, supplements & behind the hunt.": "Consejos de entreno, suplementos y detrás de cámaras.",
  "Videos, guides & WOLFEX // MOTOR.": "Videos, guías y WOLFEX // MOTOR.",
  "WOLFEX // Motor": "WOLFEX // Motor", "Lifestyle extension": "Extensión de estilo de vida", "Built for speed. Designed for movement.": "Hecho para la velocidad. Diseñado para el movimiento.",
  "In development": "En desarrollo", "Night shift": "Turno nocturno", "Chapter": "Capítulo", "Status": "Estado", "Mode": "Modo",
  "Early access": "Acceso anticipado", "Join the pack.": "Únete a la manada.", "Get early access to offers, new supplements and WOLFEX updates.": "Recibe primero las ofertas, los suplementos nuevos y las novedades de WOLFEX.",
  "Email address": "Correo electrónico", "You're in. Welcome to the pack.": "¡Ya estás dentro! Bienvenido a la manada.", "Join": "Unirme", "Joining…": "Uniéndote…", "No spam. Only offers and new arrivals. Unsubscribe anytime.": "Sin spam. Solo ofertas y productos nuevos. Cancela cuando quieras.",
  "Navigate": "Navegar", "Follow the pack": "Sigue a la manada", "Back to top": "Volver arriba", "All rights reserved.": "Todos los derechos reservados.",
  "Contact": "Contacto", "FAQ": "Preguntas frecuentes", "Shipping": "Envíos", "Returns": "Devoluciones", "Privacy": "Privacidad",
  "Bag": "Carrito", "Close bag": "Cerrar carrito", "Your bag is empty": "Tu carrito está vacío", "No items.": "Sin artículos.", "Subtotal": "Subtotal", "Checkout": "Finalizar compra", "Remove": "Eliminar", "Qty": "Cantidad",
  "Added to bag": "Añadido al carrito", "Add to cart": "Añadir al carrito",
  "CORE": "ESENCIAL", "NEW": "NUEVO",
};

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (value: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("es");

  useEffect(() => {
    const stored = window.localStorage.getItem("wfx-language");
    if (stored === "en" || stored === "es") setLanguage(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("wfx-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (value: string) => language === "es" ? translations[value] ?? value : value,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
