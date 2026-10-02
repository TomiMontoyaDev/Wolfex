import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center">
      <p className="type-label text-arc">404 / ADMIN</p>
      <h1 className="mt-4 type-display text-[clamp(2.4rem,5vw,4rem)]">No encontrado</h1>
      <p className="mt-4 text-sm text-steel">El registro que buscas no existe o fue eliminado.</p>
      <Link href="/admin" className="mt-8 border border-arc px-6 py-3 type-label hover:bg-arc hover:text-void">
        Volver al dashboard
      </Link>
    </div>
  );
}
