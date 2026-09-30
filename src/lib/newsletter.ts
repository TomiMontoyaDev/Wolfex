/**
 * Newsletter adapter. Replace the body with your provider
 * (Klaviyo, Shopify Customer API, Resend, Mailchimp…).
 */
export async function subscribeToNewsletter(email: string): Promise<{ ok: boolean; message?: string }> {
  await new Promise((r) => setTimeout(r, 900));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email." };
  return { ok: true };
}
