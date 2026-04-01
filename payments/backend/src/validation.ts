import { z } from "zod";

export const validatePaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  token: z.string().optional(),
  cartId: z.string().optional(),
  userEmail: z.string().email().optional(),
});

export const confirmPaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
});

// Stripe PaymentIntent creation
export const createIntentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  cartId: z.string().optional(),
  userEmail: z.string().email().optional(),
});

// Stripe payment confirmation (after frontend confirms with Stripe.js)
export const confirmStripeSchema = z.object({
  paymentIntentId: z.string().min(1),
  paymentId: z.string().min(1),
  orderId: z.string().min(1),
  userEmail: z.string().email().optional(),
});

export type ValidatePaymentBody = z.infer<typeof validatePaymentSchema>;
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentSchema>;
export type CreateIntentBody = z.infer<typeof createIntentSchema>;
export type ConfirmStripeBody = z.infer<typeof confirmStripeSchema>;
