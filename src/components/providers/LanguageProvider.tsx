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
  "Collections": "Colecciones", "Find your wolf": "Encuentra tu lobo", "Explore": "Explorar",
  "Built to hunt": "Hecho para cazar", "Beyond your limits": "Más allá de tus límites", "Designed for motion": "Diseñado para moverte", "Details of the pack": "Detalles de la manada",
  "pieces": "piezas", "Shop the drop": "Comprar lanzamiento", "Explore WOLFEX": "Explorar WOLFEX",
  "Performance supplements for those who refuse to stay at the same level.": "Suplementos de rendimiento para quienes se niegan a quedarse en el mismo nivel.",
  "Heavyweight fabrics, engineered fits, zero noise. Built in small runs — when a drop is gone, it's gone.": "Tejidos gruesos, cortes diseñados y cero ruido. Producción limitada: cuando se acaba, se acaba.",
  "WOLFEX is a performance, streetwear and lifestyle brand built for those who refuse to stay at the same level. Discipline over comfort. Hunt your apex.": "WOLFEX es una marca de rendimiento, streetwear y estilo de vida para quienes se niegan a quedarse en el mismo nivel. Disciplina sobre comodidad. Alcanza tu cima.",
  "Latest drop": "Lanzamiento reciente", "Shop all": "Ver todo", "Ver catálogo completo": "Ver catálogo completo", "Limited release": "Edición limitada", "Add to bag": "Añadir a la bolsa", "Added": "Añadido",
  "Built different.": "Hecho diferente.", "Performance isn't a destination.": "El rendimiento no es un destino.", "It's a standard.": "Es un estándar.",
  "Discover WOLFEX": "Descubre WOLFEX", "No comfort.": "Sin comodidad.", "Performance without limits.": "Rendimiento sin límites.",
  "WOLFEX isn't just what you wear. It's how you operate — a system for training, moving and living at a higher standard.": "WOLFEX no es solo lo que vistes. Es cómo funcionas: un sistema de suplementos para entrenar, recuperarte y vivir con un estándar más alto.",
  "Train": "Entrena", "Move": "Muévete", "Build": "Construye", "Repeat": "Repite", "Fuel": "Alimenta", "Recover": "Recupera", "Start time": "Hora de inicio", "Stretch": "Elasticidad", "Max fabric weight": "Peso máximo de tela", "Days a year": "Días al año", "Enfoque diario": "Enfoque diario", "Ritmo constante": "Ritmo constante", "Cada semana": "Cada semana",
  "Performance system": "Sistema de rendimiento", "Scroll": "Desplaza",
  "Show up when no one is watching. Especially then.": "Preséntate cuando nadie esté mirando. Especialmente entonces.",
  "Fabrics engineered to follow every rep, sprint and turn.": "Tejidos diseñados para acompañar cada repetición, sprint y giro.",
  "Strength is built slowly, then all at once.": "La fuerza se construye lentamente, y luego de golpe.",
  "Discipline is a loop. Close it every single day.": "La disciplina es un ciclo. Ciérralo todos los días.",
  "Run with the pack.": "Corre con la manada.", "Join WOLFEX": "Únete a WOLFEX", "Community": "Comunidad",
  "WOLFEX is bigger than a logo. It's the 5AM sessions, the night runs, the people who push you past the point you would have stopped alone. Wear it. Tag it. Train with us.": "WOLFEX es más que un logo. Son las sesiones de las 5AM, las carreras nocturnas y las personas que te llevan más allá de donde te habrías detenido. Vístelo. Etiquétalo. Entrena con nosotros.",
  "WOLFEX // Motor": "WOLFEX // Motor", "Lifestyle extension": "Extensión de estilo de vida", "Built for speed. Designed for movement.": "Hecho para la velocidad. Diseñado para el movimiento.",
  "In development": "En desarrollo", "Night shift": "Turno nocturno", "Chapter": "Capítulo", "Status": "Estado", "Mode": "Modo",
  "Early access": "Acceso anticipado", "Join the pack.": "Únete a la manada.", "Get early access to drops, exclusive releases and WOLFEX updates.": "Obtén acceso anticipado a lanzamientos, ediciones exclusivas y novedades de WOLFEX.",
  "Email address": "Correo electrónico", "You're in. Welcome to the pack.": "¡Ya estás dentro! Bienvenido a la manada.", "Join": "Unirme", "No spam. Only drops. Unsubscribe anytime.": "Sin spam. Solo lanzamientos. Cancela cuando quieras.",
  "Navigate": "Navegar", "Follow the pack": "Sigue a la manada", "Back to top": "Volver arriba", "All rights reserved.": "Todos los derechos reservados.",
  "Bag": "Carrito", "Close bag": "Cerrar carrito", "Your bag is empty": "Tu carrito está vacío", "No items.": "Sin artículos.", "Subtotal": "Subtotal", "Checkout": "Finalizar compra", "Remove": "Eliminar", "Qty": "Cantidad",
  "Added to bag": "Añadido a la bolsa", "Add to cart": "Añadir al carrito", "Heavyweight Tee": "Camiseta gruesa", "Oversized Tee": "Camiseta extragrande", "Performance Shorts": "Shorts de rendimiento", "Signature Hoodie": "Sudadera exclusiva",
  "Boxed fit · 300 GSM cotton": "Corte cuadrado · algodón de 300 GSM", "Dropped shoulder · Apex back print": "Hombro caído · estampado Apex trasero", "7\" inseam · 4-way stretch": "Entrepierna de 7\" · elasticidad en 4 direcciones", "Heavy fleece · Tonal wolf emboss": "Felpa gruesa · relieve de lobo tonal",
  "CORE": "ESENCIAL", "NEW": "NUEVO", "LIMITED RELEASE": "EDICIÓN LIMITADA",
  "Secure checkout · Launching with the first drop": "Compra segura · Disponible con el primer lanzamiento",
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
