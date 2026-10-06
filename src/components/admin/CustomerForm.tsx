"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { DEPARTMENTS } from "@/data/colombia";
import type { ActionState } from "@/server/admin/actions";
import { saveCustomerAction } from "@/server/admin/sale-actions";
import { buttonClass, inputClass } from "./ui";

export interface CustomerFormValues {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  addressComplement: string;
}

/** Crear o editar un cliente (el correo es opcional: clientes de WhatsApp o de la tienda física). */
export function CustomerForm({ values }: { values: CustomerFormValues }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCustomerAction, {});
  // Campos controlados: React limpia el formulario tras enviarlo y, si hay un error, se perdería lo escrito.
  const [form, setForm] = useState(values);
  const set = (key: keyof CustomerFormValues) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const field = `mt-1.5 ${inputClass}`;
  const label = "type-label text-steel";

  return (
    <form action={action} className="max-w-3xl space-y-5 rounded-sm border border-line-strong bg-ink/80 p-5 sm:p-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={label}>Nombre completo *</span>
          <input name="fullName" required maxLength={120} value={form.fullName} onChange={set("fullName")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Teléfono / WhatsApp</span>
          <input name="phone" maxLength={40} inputMode="tel" value={form.phone} onChange={set("phone")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Correo (opcional)</span>
          <input name="email" type="email" maxLength={160} value={form.email} onChange={set("email")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Departamento</span>
          <select name="department" value={form.department} onChange={set("department")} className={`${field} appearance-none`}>
            <option value="">—</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Ciudad</span>
          <input name="city" maxLength={80} value={form.city} onChange={set("city")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Dirección</span>
          <input name="address" maxLength={240} value={form.address} onChange={set("address")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Complemento (apto, barrio…)</span>
          <input name="addressComplement" maxLength={160} value={form.addressComplement} onChange={set("addressComplement")} className={field} />
        </label>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-4">
        <button disabled={pending} className={buttonClass}>
          {pending ? "Guardando…" : values.id ? "Guardar cambios" : "Crear cliente"}
        </button>
        <Link href={values.id ? `/admin/customers/${values.id}` : "/admin/customers"} className="type-label text-steel hover:text-arc">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
