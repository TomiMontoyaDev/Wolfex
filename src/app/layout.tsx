import { Analytics } from "@vercel/analytics/next";
import { MetaPixelPageViews } from "@/components/analytics/MetaPixel";
import { META_PIXEL_BASE_CODE, META_PIXEL_NOSCRIPT_SRC } from "@/lib/meta-pixel";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ExitIntent } from "@/components/cart/ExitIntent";
import { GoalFinder } from "@/components/conversion/GoalFinder";
import { WhatsAppButton } from "@/components/conversion/WhatsAppButton";
import { Footer } from "@/components/layout/Footer";
import { Loader } from "@/components/layout/Loader";
import { Navbar } from "@/components/layout/Navbar";
import { StorefrontOnly } from "@/components/layout/StorefrontOnly";
import { Providers } from "@/components/providers/Providers";
import { CustomCursor } from "@/components/visuals/CustomCursor";
import { SITE, SOCIALS } from "@/data/site";
import "./globals.css";

// Self-hosted variable fonts via next/font — zero layout shift, no external requests.
const archivo = localFont({
  src: "../fonts/Archivo-Variable.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

const jetbrains = localFont({
  src: "../fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Suplementos deportivos en Colombia`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: ["WOLFEX", "suplementos deportivos", "proteína", "creatina", "pre-entreno", "vitaminas", "tienda de suplementos Colombia", "suplementos Pereira"],
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — Suplementos deportivos en Colombia`,
    description: SITE.description,
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Suplementos deportivos en Colombia`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  category: "health",
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  slogan: "Alcanza tu cima.",
  foundingDate: String(SITE.established),
  sameAs: SOCIALS.map((s) => s.href),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        {/* Meta Pixel Code — en el <head>, como indica Meta (el propio código se salta el /admin). */}
        <script id="meta-pixel" dangerouslySetInnerHTML={{ __html: META_PIXEL_BASE_CODE }} />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: "none" }} alt="" src={META_PIXEL_NOSCRIPT_SRC} />
        </noscript>
        {/* End Meta Pixel Code */}
      </head>
      <body>
        <noscript>
          <style>{`#wfx-loader{display:none!important}`}</style>
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Providers>
          <StorefrontOnly>
            <Loader />
            <Navbar />
            <CartDrawer />
            <ExitIntent />
            <GoalFinder />
            <WhatsAppButton />
          </StorefrontOnly>
          {children}
          <StorefrontOnly>
            <Footer />
            <CustomCursor />
            {/* Vercel Analytics: solo en la tienda, para que las visitas al /admin no inflen las métricas. */}
            <Analytics />
            {/* Meta Pixel: PageView al navegar dentro de la tienda (el código base está en el <head>). */}
            <MetaPixelPageViews />
          </StorefrontOnly>
        </Providers>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
