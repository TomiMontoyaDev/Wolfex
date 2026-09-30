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
  },
  experimental: {
    // Tree-shake icon + animation libraries down to what is actually imported.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
