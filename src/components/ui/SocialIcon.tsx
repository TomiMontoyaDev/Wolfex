import type { SocialPlatform } from "@/data/site";

/** Minimal line glyphs for social platforms (Lucide ships no brand icons). */
export function SocialIcon({ platform, className = "h-5 w-5" }: { platform: SocialPlatform; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, "aria-hidden": true } as const;
  switch (platform) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 3c.4 2.6 2.2 4.4 5 4.7" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
          <path d="M10.5 9.5v5l4.2-2.5z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
