"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ShippingNotice } from "@/components/cart/ShippingNotice";
import { useCart } from "@/components/providers/CartProvider";
import { Media } from "@/components/ui/Media";
import { COLOMBIA, DEPARTMENTS, OTHER_CITY } from "@/data/colombia";
import { hasFreeShipping } from "@/config/shipping";
import { formatPrice } from "@/lib/utils";

const fields = [
  { key: "name", label: "Nombre completo", type: "text" },
  { key: "email", label: "Correo electrónico", type: "email" },
  { key: "phone", label: "Teléfono", type: "tel" },
] as const;

const inputClass =
  "mt-2 h-14 w-full rounded-sm border border-line-strong bg-void px-4 text-sm text-bone outline-none transition-[border-color,box-shadow] placeholder:text-steel/60 focus:border-arc focus:shadow-[0_0_0_3px_rgba(0,168,255,0.12)]";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", department: "", city: "", otherCity: "", address: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cities = form.department ? COLOMBIA[form.department] ?? [] : [];
  const deliveryCity = form.city === OTHER_CITY ? form.otherCity : form.city;
  const payload = useMemo(() => {
    const { otherCity, ...customer } = form;
    return JSON.stringify({
      customer: { ...customer, city: customer.city === OTHER_CITY ? otherCity : customer.city },
      lines: lines.map((line) => ({ productId: line.product.id, color: line.color, quantity: line.quantity })),
    });
  }, [form, lines]);
  // Misma clave mientras no cambien los datos: un doble clic o reintento no crea un pedido duplicado.
  const idempotencyKey = useMemo(() => (payload ? crypto.randomUUID() : ""), [payload]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: payload,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible preparar el pago.");
      if (!data.checkoutUrl) throw new Error("Mercado Pago no está configurado todavía.");
      window.location.href = data.checkoutUrl;
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible iniciar el pago.");
      setLoading(false);
    }
  }

  if (!lines.length) {
    return <main className="container-wfx flex min-h-screen items-center justify-center"><p className="type-headline text-3xl">Tu carrito está vacío.</p></main>;
  }

  return (
    <>
      <main className="container-wfx min-h-screen py-28 md:py-36">
        <motion.button onClick={() => router.push("/")} className="type-label text-steel transition-colors hover:text-arc" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          ← Volver al carrito
        </motion.button>

        <motion.div className="mt-8 max-w-3xl" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08 }}>
          <p className="type-label text-arc">WOLFEX / CHECKOUT SEGURO</p>
          <h1 className="mt-3 type-display text-[clamp(3.5rem,9vw,8rem)] leading-[0.82]">Finaliza tu compra</h1>
          <p className="mt-6 max-w-xl text-sm leading-6 text-steel">Completa tus datos y continúa al pago seguro con Mercado Pago. Tus datos de tarjeta nunca pasan por los servidores de WOLFEX.</p>
        </motion.div>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] lg:gap-16">
          <motion.form onSubmit={submit} className="rounded-sm border border-line-strong bg-ink/70 p-5 shadow-[0_20px_80px_-50px_rgba(0,102,255,0.8)] backdrop-blur-sm sm:p-8" initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18 }}>
            <div className="flex items-start justify-between gap-4 border-b border-line pb-6">
              <div><p className="type-label text-arc">01</p><h2 className="mt-2 type-title text-xl">Datos de entrega</h2></div>
              <span className="border border-arc/40 px-3 py-2 type-label text-arc">COP · Colombia</span>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key} className={field.key === "name" ? "block sm:col-span-2" : "block"}>
                  <span className="type-label text-steel">{field.label}</span>
                  <input required type={field.type} value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className={inputClass} />
                </label>
              ))}
              <label className="block">
                <span className="type-label text-steel">Departamento</span>
                <span className="relative block">
                  <select
                    required
                    value={form.department}
                    onChange={(event) => setForm({ ...form, department: event.target.value, city: "", otherCity: "" })}
                    className={`${inputClass} cursor-pointer appearance-none pr-10 ${form.department ? "" : "text-steel/70"}`}
                  >
                    <option value="" disabled>Selecciona…</option>
                    {DEPARTMENTS.map((department) => (
                      <option key={department} value={department} className="bg-ink text-bone">{department}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-steel" strokeWidth={1.5} aria-hidden="true" />
                </span>
              </label>
              <label className="block">
                <span className="type-label text-steel">Ciudad / municipio</span>
                <span className="relative block">
                  <select
                    required
                    disabled={!form.department}
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value, otherCity: "" })}
                    className={`${inputClass} cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-50 ${form.city ? "" : "text-steel/70"}`}
                  >
                    <option value="" disabled>{form.department ? "Selecciona…" : "Primero elige el departamento"}</option>
                    {cities.map((city) => (
                      <option key={city} value={city} className="bg-ink text-bone">{city}</option>
                    ))}
                    {form.department && <option value={OTHER_CITY} className="bg-ink text-bone">{OTHER_CITY}…</option>}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-steel" strokeWidth={1.5} aria-hidden="true" />
                </span>
              </label>
              {form.city === OTHER_CITY && (
                <label className="block sm:col-span-2">
                  <span className="type-label text-steel">Escribe tu municipio</span>
                  <input required minLength={2} maxLength={80} value={form.otherCity} onChange={(event) => setForm({ ...form, otherCity: event.target.value })} className={inputClass} autoFocus />
                </label>
              )}
              <label className="block sm:col-span-2">
                <span className="type-label text-steel">Dirección de entrega</span>
                <input required type="text" value={form.address} placeholder="Calle, número, barrio, apto…" onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass} />
              </label>
            </div>
            {error && <p role="alert" className="mt-5 text-sm text-red-400">{error}</p>}
            <button disabled={loading} className="group relative mt-8 flex h-16 w-full items-center justify-between overflow-hidden bg-volt px-5 type-title text-sm text-bone transition-shadow hover:shadow-[0_0_35px_rgba(0,102,255,0.38)] disabled:opacity-50">
              <span className="absolute inset-y-0 left-0 w-0 bg-arc transition-all duration-500 group-hover:w-full" />
              <span className="relative">{loading ? "Preparando pago…" : "💳 Continuar al pago"}</span>
              <span className="relative text-xl transition-transform duration-500 group-hover:translate-x-1">→</span>
            </button>
            <p className="mt-4 text-center type-label text-steel/70">Pago procesado de forma segura por Mercado Pago</p>
          </motion.form>

          <motion.aside className="relative overflow-hidden rounded-sm border border-volt/30 bg-ink p-5 shadow-[0_25px_90px_-55px_rgba(0,102,255,0.9)] sm:p-7" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.28 }}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-volt/20 blur-[90px]" />
            <div className="relative flex items-start justify-between gap-4">
              <div><p className="type-label text-arc">02</p><h2 className="mt-2 type-title text-xl">Resumen de compra</h2></div>
              <span className="type-label text-steel">{lines.length} {lines.length === 1 ? "producto" : "productos"}</span>
            </div>
            <ul className="relative mt-7 space-y-4">
              {lines.map((line, index) => (
                <motion.li key={line.key} className="flex items-center gap-4 border-b border-line pb-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 + index * 0.06 }}>
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-void ring-1 ring-inset ring-line-strong"><Media slot={line.product.images.primary} sizes="64px" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate type-title text-sm">{line.product.name}</p><p className="mt-1 type-label text-steel">{line.color} · Cantidad {line.quantity}</p></div>
                  <span className="font-mono text-xs">{formatPrice(line.product.price * line.quantity)}</span>
                </motion.li>
              ))}
            </ul>
            <div className="relative mt-7 space-y-3 border-t border-line pt-5 text-sm">
              <div className="flex justify-between text-steel"><span>Subtotal</span><span className="font-mono">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between gap-4 text-steel">
                <span>Envío</span>
                {hasFreeShipping(subtotal, deliveryCity || null) ? (
                  <span className="type-label text-arc">GRATIS</span>
                ) : (
                  <span className="text-right text-[0.625rem] leading-snug text-steel/70">Según producto y localidad</span>
                )}
              </div>
              <div className="flex justify-between border-t border-line pt-4 type-title text-lg"><span>Total</span><span className="font-mono text-arc">{formatPrice(subtotal)}</span></div>
              <div className="pt-2"><ShippingNotice subtotal={subtotal} city={deliveryCity || undefined} /></div>
            </div>
          </motion.aside>
        </div>
      </main>
    </>
  );
}
