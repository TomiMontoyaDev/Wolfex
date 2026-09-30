import Image from "next/image";
import type { MediaSlot } from "@/data/media";
import { cn } from "@/lib/utils";
import { PlaceholderArt } from "@/components/visuals/PlaceholderArt";

interface MediaProps {
  slot: MediaSlot;
  className?: string;
  /** next/image `sizes` — set it per layout for good LCP and bandwidth. */
  sizes?: string;
  priority?: boolean;
  /** Prefer the video over the image when both are ready. */
  preferVideo?: boolean;
}

/**
 * One component for every visual. Renders the designed placeholder until
 * `slot.ready` is flipped in /src/data/media.ts, then an optimized
 * next/image (or a muted looping <video>).
 */
export function Media({ slot, className, sizes = "100vw", priority, preferVideo }: MediaProps) {
  const devLabel = process.env.NODE_ENV === "development" ? slot.src.replace("/images/", "") : undefined;

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-ink", className)} data-media-src={slot.src}>
      {!slot.ready ? (
        <PlaceholderArt art={slot.art} label={devLabel} />
      ) : preferVideo && slot.video ? (
        <video
          className="h-full w-full object-cover"
          src={slot.video}
          poster={slot.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={slot.alt}
        />
      ) : (
        <Image src={slot.src} alt={slot.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      )}
    </div>
  );
}
