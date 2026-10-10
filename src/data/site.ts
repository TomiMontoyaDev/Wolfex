import { CONTACT } from "@/lib/site-config";
import { MEDIA } from "./media";

export const SITE = {
  name: "WOLFEX",
  tagline: "ALCANZA TU CIMA.",
  description:
    "WOLFEX es tu tienda de suplementos deportivos en Colombia: proteínas, creatinas, pre-entrenos y vitaminas para entrenar más fuerte y recuperarte mejor. Disciplina sobre comodidad. Alcanza tu cima.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://wolfex.xyz",
  established: 2026,
  locale: "es-CO",
  currency: "COP",
  mantras: [
    "NACIDOS PARA CAZAR.",
    "SIN EXCUSAS.",
    "MÁS ALLÁ DE TUS LÍMITES.",
    "ENCUENTRA TU LOBO.",
    "ALCANZA TU CIMA.",
  ],
} as const;

export interface NavLink {
  label: string;
  href: string;
}

/** Categorías del menú → valor de `category` en la base. La clave es lo que va en /catalogo?categoria=… */
export const CATEGORY_SLUGS = {
  suplementos: "SUPLEMENTOS",
  proteinas: "PROTEINAS",
  creatinas: "CREATINAS",
  "pre-entreno": "PRE-ENTRENO",
  "vitaminas-y-bienestar": "VITAMINAS Y BIENESTAR",
} as const;

export type CategorySlug = keyof typeof CATEGORY_SLUGS;

export const NAV_LINKS: NavLink[] = [
  { label: "Shop", href: "/catalogo" },
  { label: "Combos", href: "#combos" },
  { label: "Supplements", href: "/catalogo?categoria=suplementos" },
  { label: "Proteins", href: "/catalogo?categoria=proteinas" },
  { label: "Creatines", href: "/catalogo?categoria=creatinas" },
  { label: "Pre-workout", href: "/catalogo?categoria=pre-entreno" },
  { label: "Vitamins & wellness", href: "/catalogo?categoria=vitaminas-y-bienestar" },
  { label: "About", href: "#code" },
];

export const FOOTER_LINKS: NavLink[] = [
  { label: "Shop", href: "/catalogo" },
  { label: "About", href: "#code" },
  { label: "Contact", href: "/contacto" },
  { label: "FAQ", href: "/preguntas-frecuentes" },
  { label: "Shipping", href: "/envios" },
  { label: "Returns", href: "/devoluciones" },
  { label: "Privacy", href: "/privacidad" },
];

export type SocialPlatform = "instagram" | "tiktok" | "youtube";

export interface Social {
  platform: SocialPlatform;
  label: string;
  handle: string;
  href: string;
  /** Short line describing what the pack gets on this channel. */
  pitch: string;
}

/**
 * Todas las redes. Las que apuntan solo al dominio (tiktok.com, youtube.com) se ocultan en la tienda
 * hasta que tengan un perfil real: basta con poner la URL del perfil para que aparezcan.
 */
const ALL_SOCIALS: Social[] = [
  {
    platform: "instagram",
    label: "Instagram",
    handle: CONTACT.instagram.handle,
    href: CONTACT.instagram.url,
    pitch: "Offers, new arrivals & the pack in motion.",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    handle: "@wolfex",
    href: "https://tiktok.com/",
    pitch: "Training tips, supplements & behind the hunt.",
  },
  {
    platform: "youtube",
    label: "YouTube",
    handle: "WOLFEX",
    href: "https://youtube.com/",
    pitch: "Videos, guides & WOLFEX // MOTOR.",
  },
];

const isProfileUrl = (href: string) => new URL(href).pathname.replace(/\/+$/, "") !== "";

export const SOCIALS: Social[] = ALL_SOCIALS.filter((social) => isProfileUrl(social.href));

export const CATEGORIES = [
  {
    id: "supplements",
    index: "01",
    title: "Suplementos",
    caption: "Energía para tu cacería",
    href: "/catalogo?categoria=suplementos",
    media: MEDIA.categories.performance,
  },
  {
    id: "proteins",
    index: "02",
    title: "Proteínas",
    caption: "Construye tu fuerza",
    href: "/catalogo?categoria=proteinas",
    // Ilustración abstracta (no muestra accesorios): sirve para cualquier categoría.
    media: MEDIA.categories.accessories,
  },
] as const;

export const PERFORMANCE_PILLARS = [
  {
    word: "Energía",
    index: "01",
    line: "La constancia empieza con el combustible correcto para cada sesión.",
    metric: { value: 100, suffix: "%", label: "Enfoque diario" },
  },
  {
    word: "Construye",
    index: "02",
    line: "Proteínas y nutrientes para acompañar tu progreso todos los días.",
    metric: { value: 24, suffix: "H", label: "Ritmo constante" },
  },
  {
    word: "Recupera",
    index: "03",
    line: "Recupera mejor, vuelve más fuerte y repite: un sistema simple para cada semana.",
    metric: { value: 7, suffix: "DÍAS", label: "Cada semana" },
  },
] as const;
