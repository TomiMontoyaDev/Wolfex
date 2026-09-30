import { cn } from "@/lib/utils";

/** Technical micro-label row: "03 ─── LATEST DROP ─── WFX/SS26" */
export function SectionLabel({ index, label, meta, className }: { index: string; label: string; meta?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 type-label text-steel", className)}>
      <span className="text-arc">{index}</span>
      <span className="h-px w-8 bg-line-strong md:w-14" />
      <span className="text-bone/80">{label}</span>
      {meta && (
        <>
          <span className="hidden h-px flex-1 bg-line sm:block" />
          <span className="ml-auto hidden sm:block">{meta}</span>
        </>
      )}
    </div>
  );
}
