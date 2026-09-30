/**
 * WOLFEX — COMMERCE ADAPTER
 * ─────────────────────────────────────────────────────────────
 * The UI only ever talks to these functions. Today they read the
 * local catalog; tomorrow swap the bodies for Shopify Storefront API
 * calls (or any headless backend) — components stay untouched.
 *
 * Shopify hint:
 *   const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/2025-01/graphql.json`, {
 *     method: "POST",
 *     headers: { "X-Shopify-Storefront-Access-Token": TOKEN, "Content-Type": "application/json" },
 *     body: JSON.stringify({ query, variables }),
 *     next: { revalidate: 60 },
 *   });
 */
import { PRODUCTS, type Product } from "@/data/products";

export async function getFeaturedProducts(): Promise<Product[]> {
  return PRODUCTS;
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  return PRODUCTS.find((p) => p.handle === handle);
}

export interface CheckoutLine {
  productId: string;
  color: string;
  quantity: number;
}

/** Returns a checkout URL. Wire to Shopify `cartCreate` → `checkoutUrl`. */
export async function createCheckout(_lines: CheckoutLine[]): Promise<string | null> {
  return null;
}
