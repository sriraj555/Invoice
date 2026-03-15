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

export type ValidatePaymentBody = z.infer<typeof validatePaymentSchema>;
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentSchema>;
