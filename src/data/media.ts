/**
 * WOLFEX — MEDIA REGISTRY
 * ─────────────────────────────────────────────────────────────
 * Every visual on the site is declared here, once.
 *
 * TO REPLACE A PLACEHOLDER WITH YOUR AI-GENERATED ASSET:
 *   1. Drop the file at the `src` path (inside /public).
 *   2. Flip `ready` to `true`.
 * That's it — the <Media /> component switches from the designed
 * placeholder to an optimized next/image (or <video>) automatically.
 *
 * Recommended sizes are noted per slot. Export JPG/WebP at ~80% quality.
 */

export type PlaceholderArt =
  | "wolf"
  | "campaign"
  | "tee"
  | "tee-back"
  | "oversized"
  | "oversized-back"
  | "shorts"
  | "shorts-back"
  | "hoodie"
  | "hoodie-back"
  | "cat-men"
  | "cat-women"
  | "cat-performance"
  | "cat-accessories"
  | "motor"
  | "pack-1"
  | "pack-2"
  | "pack-3"
  | "pack-4";

export interface MediaSlot {
  /** Path inside /public, e.g. "/images/hero-wolf.jpg" */
  src: string;
  /** Optional looping background video (mp4/webm). Shown instead of the image when `ready`. */
  video?: string;
  alt: string;
  /** Set to true once the real file exists at `src` (and `video`, if provided). */
  ready: boolean;
  /** Which designed placeholder to render until `ready` is true. */
  art: PlaceholderArt;
  /** Recommended export size — documentation only. */
  recommended?: string;
}

const slot = (s: MediaSlot): MediaSlot => s;

export const MEDIA = {
  hero: slot({
    src: "/images/hero-wolf.jpg",
    video: "/videos/hero-wolf.mp4",
    alt: "Abstract wolf emerging from darkness under electric blue light",
    ready: false,
    art: "wolf",
    recommended: "2560×1440 (16:9) + 1080×1920 mobile crop, or 10s loop MP4",
  }),
  campaign: slot({
    src: "/images/campaign/built-different.jpg",
    video: "/videos/built-different.mp4",
    alt: "Athlete in WOLFEX training under a single blue light",
    ready: false,
    art: "campaign",
    recommended: "2880×1620, dark with generous negative space on the left",
  }),
  motor: slot({
    src: "/images/campaign/wolfex-motor.jpg",
    alt: "Dark sports car silhouette with electric blue rim lighting",
    ready: false,
    art: "motor",
    recommended: "2560×1200 panoramic",
  }),
  categories: {
    men: slot({ src: "/images/categories/men.jpg", alt: "WOLFEX men's collection", ready: false, art: "cat-men", recommended: "1200×1600 (3:4)" }),
    women: slot({ src: "/images/categories/women.jpg", alt: "WOLFEX women's collection", ready: false, art: "cat-women", recommended: "1200×1600 (3:4)" }),
    performance: slot({ src: "/images/categories/performance.jpg", alt: "WOLFEX performance training gear", ready: false, art: "cat-performance", recommended: "1600×1000" }),
    accessories: slot({ src: "/images/categories/accessories.jpg", alt: "WOLFEX accessories", ready: false, art: "cat-accessories", recommended: "1600×1000" }),
  },
  community: [
    slot({ src: "/images/community/pack-01.jpg", alt: "WOLFEX community training session", ready: false, art: "pack-1", recommended: "1080×1350" }),
    slot({ src: "/images/community/pack-02.jpg", alt: "WOLFEX run club at night", ready: false, art: "pack-2", recommended: "1080×1350" }),
    slot({ src: "/images/community/pack-03.jpg", alt: "WOLFEX member lifting", ready: false, art: "pack-3", recommended: "1080×1350" }),
    slot({ src: "/images/community/pack-04.jpg", alt: "WOLFEX motor meet", ready: false, art: "pack-4", recommended: "1080×1350" }),
  ],
} as const;
