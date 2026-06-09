import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Cliente Stripe compartido (servidor). Devuelve null si STRIPE_SECRET_KEY no
 * está configurada, para que los endpoints puedan degradar con elegancia.
 * La clave se lee SIEMPRE de env, nunca hardcodeada.
 */
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-04-30.basil" as any });
  }
  return _stripe;
}
