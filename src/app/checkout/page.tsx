"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { Media } from "@/components/ui/Media";
import { formatPrice } from "@/lib/utils";

declare global {
  interface Window {
    ePayco?: {
      checkout: {
        configure: (config: { key: string; test: boolean }) => { onClose?: () => void; open: (params: Record<string, string | number>) => void };
      };
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotal } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, lines: lines.map((line) => ({ productId: line.product.id, color: line.color, quantity: line.quantity })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible preparar el pago.");
      if (!data.publicKey || !window.ePayco) throw new Error("ePayco no está configurado todavía.");
      const checkout = window.ePayco.checkout.configure({ key: data.publicKey, test: data.test });
      checkout.open({
        name: "WOLFEX",
        description: data.description,
        invoice: data.invoice,
        currency: data.currency,
        amount: data.amount,
        tax: 0,
        tax_base: 0,
        country: "CO",
        lang: "es",
        external: "false",
        response: data.responseUrl,
        confirmation: data.confirmationUrl,
        extra1: data.invoice,
        name_billing: form.name,
        email_billing: form.email,
        mobilephone_billing: form.phone,
        address_billing: form.address,
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible iniciar el pago.");
    } finally {
      setLoading(false);
    }
  }

  if (!lines.length) {
    return <main className="container-wfx flex min-h-screen items-center justify-center"><p className="type-headline text-3xl">Tu carrito está vacío.</p></main>;
  }

  return (
    <>
      <Script src="https://checkout.epayco.co/checkout.js" strategy="afterInteractive" />
      <main className="container-wfx min-h-screen py-32">
        <button onClick={() => router.back()} className="type-label text-steel hover:text-arc">← Volver al carrito</button>
        <h1 className="mt-8 type-display text-[clamp(3rem,9vw,8rem)]">Checkout</h1>
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={submit} className="space-y-5">
            <h2 className="type-title text-xl">Datos de entrega</h2>
            {(["name", "email", "phone", "address"] as const).map((field) => (
              <label key={field} className="block">
                <span className="type-label text-steel">{field === "name" ? "Nombre completo" : field === "email" ? "Email" : field === "phone" ? "Teléfono" : "Dirección"}</span>
                <input required type={field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="mt-2 h-14 w-full border border-line-strong bg-ink px-4 text-bone outline-none focus:border-arc" />
              </label>
            ))}
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <button disabled={loading} className="h-14 w-full bg-volt type-title text-sm disabled:opacity-50">{loading ? "Preparando pago…" : "💳 Pagar con ePayco"}</button>
          </form>
          <aside className="border border-line p-6">
            <h2 className="type-title text-xl">Resumen</h2>
            <ul className="mt-6 divide-y divide-line">
              {lines.map((line) => <li key={line.key} className="flex gap-4 py-4"><Media slot={line.product.images.primary} sizes="64px" /><span className="flex-1 text-sm">{line.product.name} × {line.quantity}</span><span className="font-mono text-sm">{formatPrice(line.product.price * line.quantity)}</span></li>)}
            </ul>
            <div className="mt-6 flex justify-between border-t border-line pt-5 type-title"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
          </aside>
        </div>
      </main>
    </>
  );
}
