import { MEDIA } from "./media";

export const SITE = {
  name: "WOLFEX",
  tagline: "HUNT YOUR APEX.",
  description:
    "WOLFEX is a performance, streetwear and lifestyle brand built for those who refuse to stay at the same level. Discipline over comfort. Hunt your apex.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://wolfex.com",
  established: 2026,
  locale: "es-CO",
  currency: "COP",
  mantras: [
    "BUILT TO HUNT.",
    "NO COMFORT.",
    "BEYOND YOUR LIMITS.",
    "FIND YOUR WOLF.",
    "HUNT YOUR APEX.",
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
  { label: "Contact", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Shipping", href: "#" },
  { label: "Returns", href: "#" },
  { label: "Privacy", href: "#" },
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

export const SOCIALS: Social[] = [
  {
    platform: "instagram",
    label: "Instagram",
    handle: "@wolfex",
    href: "https://www.instagram.com/wolfexwear/?hl=es-la",
    pitch: "Drops, campaigns & the pack in motion.",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    handle: "@wolfex",
    href: "https://tiktok.com/",
    pitch: "Training, fits & behind the hunt.",
  },
  {
    platform: "youtube",
    label: "YouTube",
    handle: "WOLFEX",
    href: "https://youtube.com/",
    pitch: "Films, programs & WOLFEX // MOTOR.",
  },
];

export const CATEGORIES = [
  {
    id: "supplements",
    index: "01",
    title: "Supplements",
    caption: "Fuel your hunt",
    href: "/catalogo?categoria=suplementos",
    media: MEDIA.categories.performance,
  },
  {
    id: "proteins",
    index: "02",
    title: "Proteins",
    caption: "Build your strength",
    href: "/catalogo?categoria=proteinas",
    // Ilustración abstracta (no muestra accesorios): sirve para cualquier categoría.
    media: MEDIA.categories.accessories,
  },
] as const;

export const PERFORMANCE_PILLARS = [
  {
    word: "Fuel",
    index: "01",
    line: "La constancia empieza con el combustible correcto para cada sesión.",
    metric: { value: 100, suffix: "%", label: "Enfoque diario" },
  },
  {
    word: "Build",
    index: "02",
    line: "Proteínas y nutrientes para acompañar tu progreso todos los días.",
    metric: { value: 24, suffix: "H", label: "Ritmo constante" },
  },
  {
    word: "Recover",
    index: "03",
    line: "Recupera mejor, vuelve más fuerte y repite: un sistema simple para cada semana.",
    metric: { value: 7, suffix: "DÍAS", label: "Cada semana" },
  },
] as const;
