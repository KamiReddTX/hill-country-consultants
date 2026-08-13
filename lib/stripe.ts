import Stripe from "stripe";

/** Server-only Stripe client. Returns null if the secret key isn't set yet. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // apiVersion omitted → uses the version pinned by the installed stripe package.
  return new Stripe(key);
}
