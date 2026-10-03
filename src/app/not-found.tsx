import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-void text-center">
      <div className="absolute inset-0 bg-tech-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <p className="relative type-label text-arc">Error 404 — Fuera del camino</p>
      <h1 className="relative mt-6 type-display text-[clamp(5rem,22vw,18rem)] text-outline-volt">404</h1>
      <p className="relative mt-4 type-title text-sm text-steel">Esta página no existe. La manada siguió su camino.</p>
      <Link href="/" className="relative mt-10 inline-flex h-14 items-center bg-volt px-8 type-title text-[0.8125rem]">Volver al inicio</Link>
    </main>
  );
}
