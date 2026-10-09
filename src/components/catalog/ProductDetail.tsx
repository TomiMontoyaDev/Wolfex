"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight, Home, Link2, Package, ShieldCheck, ShoppingBag, Truck, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useCart } from "@/components/providers/CartProvider";
import { Media } from "@/components/ui/Media";
import { FREE_SHIPPING_NATIONAL_MIN, FREE_SHIPPING_PEREIRA_MIN, LOCAL_CITY, deliveryLabel } from "@/config/shipping";
import type { Product } from "@/data/products";
import { CATEGORY_SLUGS } from "@/data/site";
import { MAX_COMBO_PERCENT } from "@/lib/combo";
import { track } from "@/lib/meta-pixel";
import { visibleDiscount } from "@/lib/pricing";
import { productSize } from "@/lib/product-size";
import { cn, formatPrice } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const CATEGORY_LABELS: Record<string, string> = {
  SUPLEMENTOS: "Suplementos",
  PROTEINAS: "Proteínas",
  CREATINAS: "Creatinas",
  "PRE-ENTRENO": "Pre-entreno",
  "VITAMINAS Y BIENESTAR": "Vitaminas y bienestar",
  AMINOACIDOS: "Aminoácidos",
};
const categoryHref = (category: string) => {
  const slug = Object.entries(CATEGORY_SLUGS).find(([, value]) => value === category)?.[0];
  return slug ? `/catalogo?categoria=${slug}` : "/catalogo";
};

/** Ficha de producto: foto grande, precio, cantidad, agregar al carrito, beneficios, descripción y compartir. */
export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const discount = visibleDiscount(product.price, product.compareAtPrice);
  const sizes = productSize(product.name);
  const stock = product.delivery === "STOCK";

  useEffect(() => {
    setUrl(window.location.href);
    // La página de producto es la vista de producto para Meta.
    track("ViewContent", { contents: [{ id: product.sku, quantity: 1, item_price: product.price }] });
  }, [product.sku, product.price]);

  function onAdd() {
    add(product, undefined, { quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const shareText = `Mira este producto en WOLFEX: ${product.name}`;
  const shares = [
    { label: "WhatsApp", className: "bg-[#25D366] text-[#062b14]", href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}` },
    { label: "Facebook", className: "bg-[#1877F2] text-white", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "X", className: "bg-bone text-void", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}` },
  ];

  return (
    <div className="container-wfx">
      {/* Migas de pan */}
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 border-b border-line pb-4 type-label text-[0.62rem] text-steel">
        <Link href="/" className="flex items-center gap-1 hover:text-arc">
          <Home className="h-3.5 w-3.5" strokeWidth={1.5} /> Inicio
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <Link href="/catalogo" className="hover:text-arc">Catálogo</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <Link href={categoryHref(product.category)} className="hover:text-arc">{CATEGORY_LABELS[product.category] ?? product.category}</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="line-clamp-1 text-bone/80">{product.name}</span>
      </nav>

      <div className="mt-8 grid items-start gap-8 md:mt-12 md:grid-cols-2 md:gap-14">
        {/* Foto */}
        <motion.div className="relative md:sticky md:top-[calc(var(--nav-h)+2rem)]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <div className="relative aspect-square overflow-hidden rounded-sm border border-line bg-[radial-gradient(circle_at_50%_45%,rgba(0,102,255,0.28),rgba(6,21,47,0.6)_45%,#050505_75%)]">
            <motion.div className="absolute inset-0" animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <Media slot={product.images.primary} priority sizes="(min-width:768px) 50vw, 100vw" className="bg-transparent" />
            </motion.div>
            {discount && <span className="absolute left-4 top-4 bg-arc px-2 py-1 font-mono text-sm font-semibold text-void">-{discount}%</span>}
            {stock && (
              <span className="absolute right-4 top-4 flex items-center gap-1.5 border border-arc/50 bg-void/70 px-2.5 py-1.5 type-label text-[0.6rem] text-arc backdrop-blur-sm">
                <Zap className="h-3 w-3" strokeWidth={2} /> Entrega HOY
              </span>
            )}
          </div>
        </motion.div>

        {/* Información y compra */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }}>
          <p className="type-label text-arc">Marca: {product.brand}</p>
          <h1 className="mt-3 type-title text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight text-bone">{product.name}</h1>
          <p className="mt-1 font-mono text-xs text-steel">{product.sku}</p>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={cn("font-mono text-3xl md:text-4xl", discount ? "text-arc" : "text-bone")}>{formatPrice(product.price)}</span>
            {discount && product.compareAtPrice && (
              <s className="font-mono text-base text-steel" aria-label={`Precio público ${formatPrice(product.compareAtPrice)}`}>
                {formatPrice(product.compareAtPrice)}
              </s>
            )}
          </div>
          <p className="mt-2 text-xs text-steel">Los gastos de envío se calculan en el checkout. Pago seguro con Mercado Pago.</p>

          {product.delivery && (
            <p className={cn("mt-5 flex items-center gap-2 text-sm", stock ? "text-arc" : "text-steel")}>
              <span className={cn("h-2 w-2 rounded-full", stock ? "bg-arc shadow-[0_0_10px_rgba(0,168,255,0.9)]" : "bg-steel")} aria-hidden="true" />
              {stock ? `${deliveryLabel("STOCK")} · disponible en bodega` : `${deliveryLabel("DROP")} a toda Colombia`}
            </p>
          )}

          {sizes.length > 0 && (
            <div className="mt-6">
              <p className="type-label text-steel">Presentación</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <li key={size} className="flex items-center gap-2 border border-line-strong px-3 py-2 type-label text-bone">
                    <Package className="h-3.5 w-3.5 text-arc" strokeWidth={1.5} aria-hidden="true" />
                    {size}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cantidad + agregar */}
          <div className="mt-8">
            {product.available ? (
              <>
                <p className="type-label text-steel">Cantidad</p>
                <div className="mt-2 flex gap-3">
                  <div className="flex items-center [&>div]:h-14 [&_button]:h-14 [&_button]:w-12">
                    <QuantityStepper value={quantity} label={product.name} onChange={(value) => setQuantity(Math.max(1, value))} />
                  </div>
                  <button
                    type="button"
                    onClick={onAdd}
                    className={cn(
                      "flex h-14 flex-1 items-center justify-center gap-2 type-title text-sm transition-[background-color,box-shadow,color]",
                      added ? "bg-bone text-void" : "bg-volt text-bone hover:shadow-[0_0_35px_rgba(0,102,255,0.45)]",
                    )}
                  >
                    {added ? <Check className="h-5 w-5" strokeWidth={2} /> : <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />}
                    {added ? "Agregado al carrito" : "Agregar al carrito"}
                  </button>
                </div>
              </>
            ) : (
              <p className="flex h-14 items-center justify-center border border-line-strong type-label text-steel">Agotado</p>
            )}
          </div>

          {/* Beneficios reales de la tienda */}
          <ul className="mt-6 grid gap-2.5 border-y border-line py-5 text-sm text-bone/85">
            <li className="flex items-start gap-3">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-arc" strokeWidth={1.5} />
              Envío GRATIS en {LOCAL_CITY} desde {formatPrice(FREE_SHIPPING_PEREIRA_MIN)} y a toda Colombia desde {formatPrice(FREE_SHIPPING_NATIONAL_MIN)}
            </li>
            <li className="flex items-start gap-3">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-arc" strokeWidth={1.5} />
              <span>
                Llévalo en combo y ahorra hasta −{MAX_COMBO_PERCENT}%.{" "}
                <Link href="/#combos" className="text-arc underline-offset-4 hover:underline">Arma tu combo</Link>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-arc" strokeWidth={1.5} />
              Producto original · pago seguro con Mercado Pago
            </li>
          </ul>

          {product.descriptor && (
            <div className="mt-6">
              <h2 className="type-label text-steel">¿Para qué sirve?</h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-bone/90">{product.descriptor}</p>
            </div>
          )}
          <p className="mt-4 text-xs text-steel/80">Suplemento dietario. No reemplaza una alimentación balanceada.</p>

          {/* Compartir */}
          <div className="mt-8">
            <p className="type-label text-steel">Comparte</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {shares.map((share) => (
                <a key={share.label} href={share.href} target="_blank" rel="noopener noreferrer" className={cn("flex h-10 items-center px-4 text-xs font-semibold transition-opacity hover:opacity-85", share.className)}>
                  {share.label}
                </a>
              ))}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  } catch {}
                }}
                className="flex h-10 items-center gap-2 border border-line-strong px-4 text-xs text-bone transition-colors hover:border-arc hover:text-arc"
              >
                {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" strokeWidth={1.5} />}
                {copied ? "Enlace copiado" : "Copiar enlace"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
