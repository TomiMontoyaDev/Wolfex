import { cn } from "@/lib/utils";

/** Infinite mantra ticker. Pure CSS — zero JS cost. */
export function Marquee({ items, className, reverse }: { items: readonly string[]; className?: string; reverse?: boolean }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 md:px-10">{t}</span>
          <span className="h-1.5 w-1.5 rotate-45 bg-volt" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={cn("relative flex overflow-hidden border-y border-line py-5 select-none", className)} aria-hidden="true">
      <div className="flex w-max animate-marquee" style={reverse ? { animationDirection: "reverse" } : undefined}>
        {row}
        {row}
      </div>
    </div>
  );
}
