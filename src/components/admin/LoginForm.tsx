"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/server/admin/actions";
import { buttonClass, inputClass } from "./ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-10 space-y-5">
      <label className="block">
        <span className="type-label text-steel">Contraseña de administrador</span>
        <input name="password" type="password" required autoComplete="current-password" autoFocus className={`mt-2 ${inputClass} h-14`} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-300">
          {state.error}
        </p>
      )}
      <button disabled={pending} className={`${buttonClass} h-14 w-full justify-between`}>
        <span>{pending ? "Verificando…" : "Entrar al panel"}</span>
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
