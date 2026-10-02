import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/server/auth";

export const metadata: Metadata = { title: "Acceso" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-volt/15 blur-[140px]" />
      <div className="relative w-full max-w-md rounded-sm border border-line-strong bg-ink/85 p-7 shadow-[0_30px_100px_-60px_rgba(0,102,255,0.9)] backdrop-blur-sm sm:p-10">
        <p className="type-label text-arc">WOLFEX® / ADMIN</p>
        <h1 className="mt-4 type-display text-5xl">Acceso restringido</h1>
        <p className="mt-4 text-sm leading-6 text-steel">Panel de control de pedidos, clientes y ventas. Solo personal autorizado.</p>
        <LoginForm />
        <a href="/" className="mt-8 block text-center type-label text-steel transition-colors hover:text-arc">
          ← Volver a la tienda
        </a>
      </div>
    </main>
  );
}
