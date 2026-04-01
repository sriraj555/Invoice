import Stripe from "stripe";
import { env } from "./env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!env.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(env.stripeSecretKey);
  }
  return stripeInstance;
}
