"use client";

import Link from "next/link";

/** Barra superior de las páginas de impresión (se oculta al imprimir). */
export function PrintToolbar({ count }: { count: number }) {
  return (
    <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-void/95 px-6 py-3 backdrop-blur">
      <Link href="/admin/facturas" className="type-label text-steel hover:text-arc">
        ← Volver a facturas
      </Link>
      <div className="flex items-center gap-4">
        <span className="type-label text-steel">{count === 1 ? "1 comprobante" : `${count} comprobantes`} · carta · márgenes 15 mm</span>
        <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center bg-volt px-6 type-label text-bone hover:bg-arc hover:text-void">
          Imprimir
        </button>
      </div>
    </div>
  );
}
