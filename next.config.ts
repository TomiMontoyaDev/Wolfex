import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Add your CDN / Shopify domains here when products come from a backend:
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
    // Las imágenes subidas desde /admin viven en un Blob store privado y se sirven por /api/images/… (ruta local).
  },
  experimental: {
    // Tree-shake icon + animation libraries down to what is actually imported.
    optimizePackageImports: ["lucide-react", "framer-motion"],
    // Las imágenes se comprimen en el navegador antes de subir; 4 MB cubre el peor caso
    // sin pasar el límite de 4,5 MB por petición de Vercel.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
