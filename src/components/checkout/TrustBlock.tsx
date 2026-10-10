import { CreditCard, MessageCircle, PackageCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Medios de pago aceptados (nombres en texto: sin logos de terceros). */
export function PaymentIcons({ className }: { className?: string }) {
  const items = [
    { label: "PSE", className: "border-[#00a3e0]/50 text-[#5cc8f0]" },
    { label: "Tarjeta", icon: true, className: "border-bone/30 text-bone" },
    { label: "Nequi", className: "border-[#e5007e]/50 text-[#ff5cb3]" },
    { label: "Bancolombia", className: "border-[#fdda24]/50 text-[#fdda24]" },
  ];
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Medios de pago aceptados">
      {items.map((item) => (
        <li key={item.label} className={cn("flex h-7 items-center gap-1 rounded-sm border bg-void/60 px-2 font-mono text-[0.62rem] font-semibold uppercase tracking-wide", item.className)}>
          {item.icon && <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Bloque de confianza junto al botón de pagar. */
export function TrustBlock({ className }: { className?: string }) {
  const items = [
    { icon: ShieldCheck, text: "Pago protegido por Mercado Pago" },
    { icon: PackageCheck, text: "Producto original y sellado" },
    { icon: MessageCircle, text: "Te acompañamos por WhatsApp" },
  ];
  return (
    <div className={cn("space-y-3", className)}>
      <ul className="grid gap-2 text-xs text-bone/85">
        {items.map((item) => (
          <li key={item.text} className="flex items-center gap-2.5">
            <item.icon className="h-4 w-4 shrink-0 text-arc" strokeWidth={1.75} aria-hidden="true" />
            {item.text}
          </li>
        ))}
      </ul>
      <PaymentIcons />
    </div>
  );
}
