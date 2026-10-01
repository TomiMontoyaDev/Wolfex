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

export const NAV_LINKS: NavLink[] = [
  { label: "Shop", href: "#drop" },
  { label: "Supplements", href: "#categories" },
  { label: "Accessories", href: "#categories" },
  { label: "About", href: "#code" },
];

export const FOOTER_LINKS: NavLink[] = [
  { label: "Shop", href: "#drop" },
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
    href: "#",
    media: MEDIA.categories.performance,
  },
  {
    id: "accessories",
    index: "02",
    title: "Accessories",
    caption: "Details of the pack",
    href: "#",
    media: MEDIA.categories.accessories,
  },
] as const;

export const PERFORMANCE_PILLARS = [
  {
    word: "Train",
    index: "01",
    line: "Show up when no one is watching. Especially then.",
    metric: { value: 5, suffix: "AM", label: "Start time" },
  },
  {
    word: "Move",
    index: "02",
    line: "Fabrics engineered to follow every rep, sprint and turn.",
    metric: { value: 4, suffix: "-WAY", label: "Stretch" },
  },
  {
    word: "Build",
    index: "03",
    line: "Strength is built slowly, then all at once.",
    metric: { value: 480, suffix: "GSM", label: "Max fabric weight" },
  },
  {
    word: "Repeat",
    index: "04",
    line: "Discipline is a loop. Close it every single day.",
    metric: { value: 365, suffix: "", label: "Days a year" },
  },
] as const;
