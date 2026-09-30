# WOLFEX — Hunt Your Apex.

Premium performance / streetwear / lifestyle brand site.
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · GSAP + ScrollTrigger · Lucide · next/font · next/image.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Deploy (GitHub → Vercel)

```bash
git remote add origin https://github.com/<you>/wolfex.git
git push -u origin main
```
Import the repo in Vercel — zero config. Set `NEXT_PUBLIC_SITE_URL` to your domain (used for SEO, sitemap, OG).

## Structure

```
src/
  app/                layout (fonts, SEO, JSON-LD), page, template (page transitions),
                      not-found, robots, sitemap, manifest, OG image, icon
  components/
    layout/           Navbar (+ mobile menu), Loader, CartDrawer, Footer
    sections/         Hero, BrandStatement, FeaturedProducts, CampaignSection, Categories,
                      PerformanceSection, MotorSection, Community, Newsletter
    ui/               Media, MagneticButton, SplitReveal, Reveal, Counter, Marquee,
                      SectionLabel, SocialIcon
    visuals/          WolfMark (faceted logo), PlaceholderArt, Particles, CustomCursor
    providers/        Cart + Intro context, MotionConfig
  data/               media.ts (every image slot), products.ts, site.ts (nav, copy, socials)
  lib/                commerce.ts (Shopify-ready adapter), newsletter.ts, gsap.ts, utils.ts
  fonts/              Archivo Variable (width + weight axes), JetBrains Mono — self-hosted
```

## Replacing placeholders with your AI images

1. Put the file at the path listed in `public/images/README.md`.
2. In `src/data/media.ts` (or `src/data/products.ts`) set `ready: true`.

`<Media />` switches from the designed placeholder to an optimized `next/image`
(or muted looping `<video>` for hero/campaign when a `video` path is set).
In `npm run dev`, each placeholder shows its target filename in the corner.

## Products & Shopify

Products live in `src/data/products.ts`, shaped like Shopify Storefront data.
The page reads them through `getFeaturedProducts()` in `src/lib/commerce.ts` —
swap that function's body for a Storefront API query and the UI stays untouched.
Cart state is in `CartProvider`; `createCheckout()` is the hook for Shopify `cartCreate`.

## Motion system

| Effect | Tech |
|---|---|
| Loader 001→100%, logo reveal, hero char reveal | Framer Motion |
| Cursor-reactive hero depth, magnetic CTAs, custom cursor | Framer Motion springs |
| Manifesto word-by-word scrub, campaign parallax, pinned horizontal Performance | GSAP ScrollTrigger |
| Scroll reveals, counters, kinetic Motor type, community parallax | Framer Motion |
| Grain, marquees, light sweeps, hovers | CSS only |

Everything respects `prefers-reduced-motion`; the custom cursor only mounts on fine pointers;
the particle canvas pauses off-screen and caps DPR at 2. No Three.js — none of the visuals needed it.

## Brand tokens

`src/app/globals.css` → `@theme`: void `#050505`, ink `#0A0A0D`, volt `#0066FF`,
arc `#00A8FF`, abyss `#06152F`, bone `#F5F7FA`, steel `#70757D`.
Type classes: `type-display`, `type-headline`, `type-title`, `type-label`, `type-body`.
