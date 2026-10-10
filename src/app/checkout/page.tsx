"use client";

import { motion } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ShippingNotice } from "@/components/cart/ShippingNotice";
import { EMPTY_INVOICE, InvoiceFields, type InvoiceData } from "@/components/checkout/InvoiceFields";
import { TrustBlock } from "@/components/checkout/TrustBlock";
import { useLeadCapture } from "@/components/checkout/useLeadCapture";
import { ProteinCapNote } from "@/components/combo/ComboSection";
import { ComboUpsell } from "@/components/combo/ComboUpsell";
import { useComboQuote } from "@/components/combo/useComboQuote";
import { useCart } from "@/components/providers/CartProvider";
import { Media } from "@/components/ui/Media";
import { PAYMENT_METHODS, PICKUP_CITY, type CheckoutPaymentMethod } from "@/config/payments";
import { quoteShipping } from "@/config/shipping";
import { COLOMBIA, DEPARTMENTS, OTHER_CITY } from "@/data/colombia";
import { track } from "@/lib/meta-pixel";
import { whatsappLink } from "@/lib/site-config";
import { cn, formatPrice } from "@/lib/utils";

// Contacto primero: si la persona no termina, al menos queda cómo ayudarle a completar la compra.
const fields = [
  { key: "phone", label: "WhatsApp / teléfono", type: "tel", autoComplete: "tel" },
  { key: "email", label: "Correo electrónico", type: "email", autoComplete: "email" },
  { key: "name", label: "Nombre completo", type: "text", autoComplete: "name" },
] as const;

const inputClass =
  "mt-2 h-14 w-full rounded-sm border border-line-strong bg-void px-4 text-sm text-bone outline-none transition-[border-color,box-shadow] placeholder:text-steel/60 focus:border-arc focus:shadow-[0_0_0_3px_rgba(0,168,255,0.12)]";

const sameCity = (a: string, b: string) => a.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase() === b.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

const SUBMIT_LABEL: Record<CheckoutPaymentMethod, string> = {
  MERCADOPAGO: "💳 Pagar con Mercado Pago",
  TRANSFER: "Confirmar pedido y ver datos de pago",
  PICKUP: "Confirmar pedido para recoger",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", department: "", city: "", otherCity: "", address: "" });
  const [method, setMethod] = useState<CheckoutPaymentMethod>("MERCADOPAGO");
  const [invoiceOn, setInvoiceOn] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData>(EMPTY_INVOICE);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cities = form.department ? COLOMBIA[form.department] ?? [] : [];
  const deliveryCity = form.city === OTHER_CITY ? form.otherCity : form.city;

  // Recoger solo existe en Pereira: si cambia la ciudad, el método vuelve a Mercado Pago.
  const canPickup = !!deliveryCity && sameCity(deliveryCity, PICKUP_CITY);
  const paymentMethod: CheckoutPaymentMethod = method === "PICKUP" && !canPickup ? "MERCADOPAGO" : method;
  const pickup = paymentMethod === "PICKUP";

  const cartContents = useMemo(() => lines.map((line) => ({ id: line.product.sku, quantity: line.quantity, item_price: line.product.price })), [lines]);
  // Descuento de combo (lo confirma el servidor al crear el pedido) + sugerencias para completarlo.
  const quoteLines = useMemo(() => lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })), [lines]);
  const { quote } = useComboQuote(quoteLines, { suggest: true });
  const productsTotal = subtotal - quote.discount;
  const weightKg = lines.reduce((sum, line) => sum + (line.product.weightKg ?? 1) * line.quantity, 0);
  // Envío: misma regla que el servidor (que es quien cobra).
  const shipping = form.department ? quoteShipping({ subtotal: productsTotal, weightKg, city: deliveryCity || null, department: form.department }) : null;
  const quoteOnly = shipping?.zone === "quote";
  const shippingCost = pickup ? 0 : (shipping?.cost ?? 0);
  const total = productsTotal + shippingCost;

  const saveLead = useLeadCapture({
    name: form.name,
    email: form.email,
    phone: form.phone,
    department: form.department,
    city: deliveryCity,
    address: form.address,
    lines: quoteLines,
  });

  // Meta: una vez por visita al checkout, con lo que hay en el carrito.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || !cartContents.length) return;
    checkoutTracked.current = true;
    track("InitiateCheckout", { contents: cartContents, value: subtotal });
  }, [cartContents, subtotal]);

  const payload = useMemo(() => {
    const { otherCity, ...customer } = form;
    return JSON.stringify({
      customer: { ...customer, address: pickup ? "" : customer.address, city: customer.city === OTHER_CITY ? otherCity : customer.city },
      lines: lines.map((line) => ({ productId: line.product.id, color: line.color, quantity: line.quantity })),
      paymentMethod,
      ...(invoiceOn && { invoice: { ...invoice, dv: invoice.dv || undefined } }),
    });
  }, [form, lines, invoiceOn, invoice, paymentMethod, pickup]);

  // Al pedir factura, se precargan los datos de entrega (el cliente puede cambiarlos).
  function toggleInvoice(enabled: boolean) {
    setInvoiceOn(enabled);
    if (!enabled) return;
    setInvoice((current) => ({
      ...current,
      legalName: current.legalName || form.name,
      email: current.email || form.email,
      phone: current.phone || form.phone.replace(/\D/g, "").replace(/^57(?=\d{10}$)/, ""),
      address: current.address || form.address,
      department: current.department || form.department,
      city: current.city || deliveryCity,
    }));
  }
  // Misma clave mientras no cambien los datos: un doble clic o reintento no crea un pedido duplicado.
  const idempotencyKey = useMemo(() => (payload ? crypto.randomUUID() : ""), [payload]);

  // Zonas especiales: el pedido se termina por WhatsApp con todo ya escrito.
  const quoteMessage = [
    "Hola WOLFEX, quiero cotizar el envío de este pedido:",
    ...lines.map((line) => `• ${line.quantity} x ${line.product.name} (${formatPrice(line.product.price * line.quantity)})`),
    `Total productos: ${formatPrice(productsTotal)}`,
    `Nombre: ${form.name || "-"}`,
    `Ciudad: ${deliveryCity || "-"}, ${form.department}`,
    `Teléfono: ${form.phone || "-"}`,
  ].join("\n");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || quoteOnly) return;
    setError("");
    setLoading(true);
    try {
      // Los datos del posible cliente quedan guardados antes del pedido (el pedido luego usa ese mismo cliente).
      await saveLead();
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: payload,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible crear el pedido.");
      const next = data.checkoutUrl ?? data.redirectUrl;
      if (!next) throw new Error("Mercado Pago no está configurado todavía.");
      // Paso de pago: el pedido ya existe (Mercado Pago, o datos de transferencia / recogida).
      track("AddPaymentInfo", {
        contents: cartContents,
        value: total,
        customer: { email: form.email, phone: form.phone, name: form.name, city: deliveryCity, department: form.department },
      });
      // Un instante para que el Pixel alcance a enviar antes de salir de la página (el envío al servidor usa keepalive).
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Navegación completa: también vacía el carrito (vive en memoria).
      window.location.href = next;
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible crear el pedido.");
      setLoading(false);
    }
  }

  if (!lines.length) {
    return <main className="container-wfx flex min-h-screen items-center justify-center"><p className="type-headline text-3xl">Tu carrito está vacío.</p></main>;
  }

  const methods = (Object.keys(PAYMENT_METHODS) as CheckoutPaymentMethod[]).filter((key) => key !== "PICKUP" || canPickup);

  return (
    <>
      <main className="container-wfx min-h-screen py-28 md:py-36">
        <motion.button onClick={() => router.push("/")} className="min-h-11 type-label text-steel transition-colors hover:text-arc" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          ← Volver a la tienda
        </motion.button>

        <motion.div className="mt-6 max-w-3xl" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08 }}>
          <p className="type-label text-arc">WOLFEX / CHECKOUT SEGURO</p>
          <h1 className="mt-3 type-display text-[clamp(2.6rem,9vw,8rem)] leading-[0.85]">Finaliza tu compra</h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-steel">Completa tus datos, elige cómo pagar y listo. El envío ya está incluido en el total.</p>
        </motion.div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] lg:gap-16">
          <motion.form onSubmit={submit} className="rounded-sm border border-line-strong bg-ink/70 p-4 shadow-[0_20px_80px_-50px_rgba(0,102,255,0.8)] backdrop-blur-sm sm:p-8" initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18 }}>
            <div className="flex items-start justify-between gap-4 border-b border-line pb-6">
              <div><p className="type-label text-arc">01</p><h2 className="mt-2 type-title text-xl">Datos de entrega</h2></div>
              <span className="border border-arc/40 px-3 py-2 type-label text-arc">COP · Colombia</span>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key} className={field.key === "name" ? "block sm:col-span-2" : "block"}>
                  <span className="type-label text-steel">{field.label}</span>
                  <input required type={field.type} autoComplete={field.autoComplete} value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className={inputClass} />
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
              {!pickup && (
                <label className="block sm:col-span-2">
                  <span className="type-label text-steel">Dirección de entrega</span>
                  <input required type="text" value={form.address} placeholder="Calle, número, barrio, apto…" onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass} />
                </label>
              )}
            </div>
            <p className="mt-4 text-xs leading-5 text-steel/80">
              Guardamos tus datos de contacto para ayudarte a completar tu compra.{" "}
              <Link href="/privacidad" className="underline underline-offset-2 transition-colors hover:text-arc">Política de privacidad</Link>
            </p>
            <InvoiceFields enabled={invoiceOn} onToggle={toggleInvoice} value={invoice} onChange={setInvoice} inputClass={inputClass} />

            {/* Método de pago */}
            <fieldset className="mt-8 border-t border-line pt-6">
              <legend className="sr-only">Método de pago</legend>
              <p className="type-label text-arc">02</p>
              <h2 className="mt-2 type-title text-xl">¿Cómo quieres pagar?</h2>
              {quoteOnly ? (
                <div className="mt-5 space-y-3">
                  <p className="text-sm text-bone/90">Para {form.department} el envío se cotiza según tu dirección, así que no hay pago en línea. Envíanos tu pedido por WhatsApp y te ayudamos a terminar la compra.</p>
                  <a
                    href={whatsappLink(quoteMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 w-full items-center justify-center gap-2 bg-[#25D366] type-title text-sm text-[#062b14]"
                  >
                    <MessageCircle className="h-5 w-5" strokeWidth={2} /> Cotizar envío por WhatsApp
                  </a>
                </div>
              ) : (
                <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label="Método de pago">
                  {methods.map((key) => (
                    <label
                      key={key}
                      className={cn(
                        "flex min-h-16 cursor-pointer items-start gap-3 border px-4 py-3.5 transition-colors",
                        paymentMethod === key ? "border-arc bg-arc/10" : "border-line-strong hover:border-arc/50",
                      )}
                    >
                      <input type="radio" name="paymentMethod" value={key} checked={paymentMethod === key} onChange={() => setMethod(key)} className="mt-1 h-5 w-5 shrink-0 accent-[#0066ff]" />
                      <span>
                        <span className="block type-title text-sm text-bone">{PAYMENT_METHODS[key].label}</span>
                        <span className="mt-0.5 block text-xs text-steel">{PAYMENT_METHODS[key].hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            {error && <p role="alert" className="mt-5 text-sm text-red-400">{error}</p>}
            {!quoteOnly && (
              <button disabled={loading} className="group relative mt-8 flex h-16 w-full items-center justify-between overflow-hidden bg-volt px-5 type-title text-sm text-bone transition-shadow hover:shadow-[0_0_35px_rgba(0,102,255,0.38)] disabled:opacity-50">
                <span className="absolute inset-y-0 left-0 w-0 bg-arc transition-all duration-500 group-hover:w-full" />
                <span className="relative text-left">{loading ? "Preparando tu pedido…" : SUBMIT_LABEL[paymentMethod]}</span>
                <span className="relative flex items-center gap-3">
                  <span className="font-mono">{formatPrice(total)}</span>
                  <span className="text-xl transition-transform duration-500 group-hover:translate-x-1">→</span>
                </span>
              </button>
            )}
            <TrustBlock className="mt-5" />
          </motion.form>

          <motion.aside className="relative overflow-hidden rounded-sm border border-volt/30 bg-ink p-4 shadow-[0_25px_90px_-55px_rgba(0,102,255,0.9)] sm:p-7" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.28 }}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-volt/20 blur-[90px]" />
            <div className="relative flex items-start justify-between gap-4">
              <div><p className="type-label text-arc">03</p><h2 className="mt-2 type-title text-xl">Resumen de compra</h2></div>
              <span className="type-label text-steel">{lines.length} {lines.length === 1 ? "producto" : "productos"}</span>
            </div>
            <ul className="relative mt-7 space-y-4">
              {lines.map((line, index) => (
                <motion.li key={line.key} className="flex items-center gap-4 border-b border-line pb-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 + index * 0.06 }}>
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-void ring-1 ring-inset ring-line-strong"><Media slot={line.product.images.primary} sizes="64px" /></div>
                  <div className="min-w-0 flex-1"><p className="line-clamp-2 type-title text-sm">{line.product.name}</p><p className="mt-1 type-label text-steel">Cantidad {line.quantity}</p></div>
                  <span className="font-mono text-xs">{formatPrice(line.product.price * line.quantity)}</span>
                </motion.li>
              ))}
            </ul>
            <div className="relative mt-7 space-y-3 border-t border-line pt-5 text-sm">
              <div className="flex justify-between text-steel"><span>Subtotal</span><span className="font-mono">{formatPrice(subtotal)}</span></div>
              {quote.discount > 0 && (
                <div className="flex justify-between gap-3 text-arc">
                  <span>Descuento combo ({quote.count} productos)</span>
                  <span className="font-mono">− {formatPrice(quote.discount)}</span>
                </div>
              )}
              {quote.capped && <ProteinCapNote />}
              <div className="flex justify-between gap-4 text-steel">
                <span>Envío{shipping && shipping.surcharge > 0 && !pickup ? " (incluye recargo por peso)" : ""}</span>
                <span className="text-right font-mono">
                  {pickup ? `Recoges en ${PICKUP_CITY}` : !shipping ? "Elige tu ciudad" : quoteOnly ? "A cotizar" : shippingCost === 0 ? <span className="type-label text-arc">GRATIS</span> : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-4 type-title text-lg"><span>Total</span><span className="font-mono text-arc">{quoteOnly ? `${formatPrice(productsTotal)} + envío` : formatPrice(total)}</span></div>
              {!pickup && <div className="pt-2"><ShippingNotice subtotal={productsTotal} weightKg={weightKg} city={deliveryCity || undefined} department={form.department || undefined} /></div>}
            </div>
            <ComboUpsell quote={quote} />
          </motion.aside>
        </div>
      </main>
    </>
  );
}
