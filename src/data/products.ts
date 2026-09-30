import type { MediaSlot } from "./media";

/**
 * WOLFEX — PRODUCT CATALOG (local)
 * ─────────────────────────────────────────────────────────────
 * Shape mirrors what a Shopify Storefront query returns (handle,
 * variants, price in minor-free decimal) so this array can later be
 * replaced by `getFeaturedProducts()` in /src/lib/commerce.ts
 * without touching any UI component.
 */

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  sku: string;
  handle: string;
  name: string;
  /** Short editorial descriptor shown under the name. */
  descriptor: string;
  price: number;
  compareAtPrice?: number;
  colors: ProductColor[];
  badge?: "LIMITED RELEASE" | "NEW" | "CORE" | "SOLD OUT SOON";
  /** Key technical spec — shown as a micro label. */
  spec: string;
  images: {
    primary: MediaSlot;
    /** Revealed on hover (back view / detail shot). */
    secondary: MediaSlot;
  };
}

const img = (file: string, alt: string, art: MediaSlot["art"]): MediaSlot => ({
  src: `/images/products/${file}`,
  alt,
  ready: false,
  art,
  recommended: "1600×2000 (4:5), product on #0A0A0D",
});

export const PRODUCTS: Product[] = [
  {
    id: "wfx-001",
    sku: "WFX-001",
    handle: "wolfex-heavyweight-tee",
    name: "Heavyweight Tee",
    descriptor: "Boxed fit · 300 GSM cotton",
    price: 58,
    colors: [
      { name: "Void Black", hex: "#0A0A0D" },
      { name: "Bone", hex: "#E9ECF0" },
      { name: "Abyss", hex: "#06152F" },
    ],
    badge: "CORE",
    spec: "300 GSM",
    images: {
      primary: img("heavyweight-tee-front.jpg", "WOLFEX Heavyweight Tee, front", "tee"),
      secondary: img("heavyweight-tee-back.jpg", "WOLFEX Heavyweight Tee, back", "tee-back"),
    },
  },
  {
    id: "wfx-002",
    sku: "WFX-002",
    handle: "wolfex-oversized-tee",
    name: "Oversized Tee",
    descriptor: "Dropped shoulder · Apex back print",
    price: 64,
    colors: [
      { name: "Void Black", hex: "#0A0A0D" },
      { name: "Steel", hex: "#70757D" },
    ],
    badge: "LIMITED RELEASE",
    spec: "280 GSM",
    images: {
      primary: img("oversized-tee-front.jpg", "WOLFEX Oversized Tee, front", "oversized"),
      secondary: img("oversized-tee-back.jpg", "WOLFEX Oversized Tee, back print", "oversized-back"),
    },
  },
  {
    id: "wfx-003",
    sku: "WFX-003",
    handle: "wolfex-performance-shorts",
    name: "Performance Shorts",
    descriptor: '7" inseam · 4-way stretch',
    price: 72,
    colors: [
      { name: "Void Black", hex: "#0A0A0D" },
      { name: "Volt Blue", hex: "#0066FF" },
    ],
    badge: "NEW",
    spec: "4-WAY STRETCH",
    images: {
      primary: img("performance-shorts-front.jpg", "WOLFEX Performance Shorts, front", "shorts"),
      secondary: img("performance-shorts-back.jpg", "WOLFEX Performance Shorts, detail", "shorts-back"),
    },
  },
  {
    id: "wfx-004",
    sku: "WFX-004",
    handle: "wolfex-signature-hoodie",
    name: "Signature Hoodie",
    descriptor: "Heavy fleece · Tonal wolf emboss",
    price: 128,
    colors: [
      { name: "Void Black", hex: "#0A0A0D" },
      { name: "Abyss", hex: "#06152F" },
      { name: "Bone", hex: "#E9ECF0" },
    ],
    badge: "LIMITED RELEASE",
    spec: "480 GSM",
    images: {
      primary: img("signature-hoodie-front.jpg", "WOLFEX Signature Hoodie, front", "hoodie"),
      secondary: img("signature-hoodie-back.jpg", "WOLFEX Signature Hoodie, back", "hoodie-back"),
    },
  },
];
