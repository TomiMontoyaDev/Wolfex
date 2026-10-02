import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · WOLFEX® Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-void bg-tech-grid">{children}</div>;
}
