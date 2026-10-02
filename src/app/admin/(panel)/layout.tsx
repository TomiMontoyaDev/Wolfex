import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/server/auth";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AdminNav />
      <main className="px-[var(--gutter)] pb-20 pt-8 lg:ml-64 lg:pt-12">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </>
  );
}
