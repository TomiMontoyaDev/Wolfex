"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { DEPARTMENTS } from "@/data/colombia";

export interface InvoiceData {
  personType: "" | "NATURAL" | "JURIDICA";
  docType: "" | "CC" | "NIT" | "CE" | "PASAPORTE";
  docNumber: string;
  dv: string;
  legalName: string;
  email: string;
  address: string;
  city: string;
  department: string;
  phone: string;
}

export const EMPTY_INVOICE: InvoiceData = { personType: "", docType: "", docNumber: "", dv: "", legalName: "", email: "", address: "", city: "", department: "", phone: "" };

const DOC_TYPES = [
  { value: "CC", label: "Cédula de ciudadanía (CC)" },
  { value: "NIT", label: "NIT" },
  { value: "CE", label: "Cédula de extranjería (CE)" },
  { value: "PASAPORTE", label: "Pasaporte" },
] as const;

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** Casilla "Necesito factura electrónica" y sus campos (todos obligatorios al marcarla). */
export function InvoiceFields({
  enabled,
  onToggle,
  value,
  onChange,
  inputClass,
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  value: InvoiceData;
  onChange: (value: InvoiceData) => void;
  inputClass: string;
}) {
  const set = (patch: Partial<InvoiceData>) => onChange({ ...value, ...patch });
  const isNit = value.docType === "NIT";

  return (
    <div className="mt-7 border-t border-line pt-6">
      <label className="flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} className="h-5 w-5 accent-[#0066ff]" />
        <span className="type-title text-sm text-bone">Necesito factura electrónica</span>
      </label>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
            <div className="grid gap-5 pt-5 sm:grid-cols-2">
              <Select
                label="Tipo de persona"
                value={value.personType}
                onChange={(personType) => set({ personType: personType as InvoiceData["personType"], ...(personType === "JURIDICA" && { docType: "NIT" }) })}
                options={[
                  { value: "NATURAL", label: "Natural" },
                  { value: "JURIDICA", label: "Jurídica" },
                ]}
                inputClass={inputClass}
              />
              <Select
                label="Tipo de documento"
                value={value.docType}
                onChange={(docType) => set({ docType: docType as InvoiceData["docType"], dv: "" })}
                options={value.personType === "JURIDICA" ? DOC_TYPES.filter((doc) => doc.value === "NIT") : [...DOC_TYPES]}
                inputClass={inputClass}
              />
              <div className={isNit ? "grid grid-cols-[1fr_88px] gap-3 sm:col-span-2" : "sm:col-span-2"}>
                <label className="block">
                  <span className="type-label text-steel">Número de documento</span>
                  <input
                    required
                    inputMode={value.docType === "PASAPORTE" ? "text" : "numeric"}
                    maxLength={20}
                    value={value.docNumber}
                    onChange={(event) => set({ docNumber: value.docType === "PASAPORTE" ? event.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase() : onlyDigits(event.target.value) })}
                    placeholder={isNit ? "900123456" : "Solo números"}
                    className={inputClass}
                  />
                </label>
                {isNit && (
                  <label className="block">
                    <span className="type-label text-steel">DV</span>
                    <input required inputMode="numeric" maxLength={1} value={value.dv} onChange={(event) => set({ dv: onlyDigits(event.target.value).slice(0, 1) })} placeholder="0" className={inputClass} />
                  </label>
                )}
              </div>
              <label className="block sm:col-span-2">
                <span className="type-label text-steel">{value.personType === "JURIDICA" ? "Razón social" : "Nombre completo o razón social"}</span>
                <input required maxLength={160} value={value.legalName} onChange={(event) => set({ legalName: event.target.value })} className={inputClass} />
              </label>
              <label className="block sm:col-span-2">
                <span className="type-label text-steel">Correo para recibir la factura</span>
                <input required type="email" maxLength={160} value={value.email} onChange={(event) => set({ email: event.target.value })} className={inputClass} />
              </label>
              <label className="block sm:col-span-2">
                <span className="type-label text-steel">Dirección de facturación</span>
                <input required maxLength={240} value={value.address} onChange={(event) => set({ address: event.target.value })} className={inputClass} />
              </label>
              <Select label="Departamento" value={value.department} onChange={(department) => set({ department })} options={DEPARTMENTS.map((department) => ({ value: department, label: department }))} inputClass={inputClass} />
              <label className="block">
                <span className="type-label text-steel">Ciudad</span>
                <input required maxLength={80} value={value.city} onChange={(event) => set({ city: event.target.value })} className={inputClass} />
              </label>
              <label className="block sm:col-span-2">
                <span className="type-label text-steel">Teléfono</span>
                <input required inputMode="numeric" maxLength={15} value={value.phone} onChange={(event) => set({ phone: onlyDigits(event.target.value) })} placeholder="Solo números" className={inputClass} />
              </label>
            </div>
            <p className="mt-4 text-xs text-steel">
              Usaremos estos datos solo para expedir tu factura.{" "}
              <Link href="/privacidad" className="text-arc underline-offset-4 hover:underline">
                Política de privacidad
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Select({ label, value, onChange, options, inputClass }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<{ value: string; label: string }>; inputClass: string }) {
  return (
    <label className="block">
      <span className="type-label text-steel">{label}</span>
      <span className="relative block">
        <select required value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} cursor-pointer appearance-none pr-10 ${value ? "" : "text-steel/70"}`}>
          <option value="" disabled>
            Selecciona…
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-ink text-bone">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-steel" strokeWidth={1.5} aria-hidden="true" />
      </span>
    </label>
  );
}
