"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/server/admin/actions";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", index: "00" },
  { href: "/admin/orders", label: "Pedidos", index: "01" },
  { href: "/admin/customers", label: "Clientes", index: "02" },
  { href: "/admin/analytics", label: "Ventas", index: "03" },
  { href: "/admin/products", label: "Productos", index: "04" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 z-40 border-b border-line bg-void/90 backdrop-blur-md lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-8">
          <Link href="/admin" className="block">
            <span className="type-headline text-xl tracking-[0.04em]">
              WOLFEX<span className="align-super text-[0.55em] text-arc">®</span>
            </span>
            <span className="mt-1 block type-label text-arc">Admin · Control</span>
          </Link>
          <form action={logoutAction} className="lg:hidden">
            <button className="type-label text-steel transition-colors hover:text-arc">Salir</button>
          </form>
        </div>

        <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 transition-colors lg:py-3",
                  active ? "bg-volt/10 text-bone" : "text-steel hover:bg-graphite hover:text-bone",
                )}
              >
                {active && <span className="absolute inset-y-2 left-0 w-0.5 bg-arc shadow-[0_0_12px_rgba(0,168,255,0.8)]" aria-hidden="true" />}
                <span className={cn("font-mono text-[0.625rem]", active ? "text-arc" : "text-steel/60")}>{link.index}</span>
                <span className="type-title text-[0.75rem]">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-line px-6 py-6 lg:block">
          <Link href="/" className="block type-label text-steel transition-colors hover:text-arc">
            ↗ Ver tienda
          </Link>
          <form action={logoutAction} className="mt-4">
            <button className="type-label text-steel transition-colors hover:text-arc">Cerrar sesión</button>
          </form>
        </div>
      </div>
    </aside>
  );
}
