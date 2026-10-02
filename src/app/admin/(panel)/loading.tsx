import { Skeleton } from "@/components/admin/ui";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-14 w-80 max-w-full" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <Skeleton className="mt-6 h-72" />
    </div>
  );
}
