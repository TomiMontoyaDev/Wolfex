"use client";

import { useEffect } from "react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center">
      <p className="type-label text-red-300">ERROR / PANEL</p>
      <h1 className="mt-4 type-display text-[clamp(2.4rem,5vw,4rem)]">No pudimos cargar los datos</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-steel">
        Revisa que la base de datos esté disponible y que DATABASE_URL esté configurada. Si el problema continúa, consulta los logs del servidor.
        {error.digest && <span className="mt-2 block font-mono text-xs text-steel/70">Ref: {error.digest}</span>}
      </p>
      <button onClick={reset} className="mt-8 border border-arc px-6 py-3 type-label text-bone transition-colors hover:bg-arc hover:text-void">
        Reintentar
      </button>
    </div>
  );
}
