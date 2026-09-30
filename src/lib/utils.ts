import { SITE } from "@/data/site";

/** Tiny className joiner — avoids a clsx/tailwind-merge dependency. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const priceFormatter = new Intl.NumberFormat(SITE.locale, {
  style: "currency",
  currency: SITE.currency,
  maximumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return priceFormatter.format(value);
}

export const pad = (n: number, size = 2) => String(n).padStart(size, "0");
