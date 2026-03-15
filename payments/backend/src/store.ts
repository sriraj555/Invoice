import type { Payment, PaymentStatus } from "./types";
import { v4 as uuidv4 } from "uuid";

const payments = new Map<string, Payment>();

export function getPayment(paymentId: string): Payment | undefined {
  return payments.get(paymentId);
}

export function getPaymentByOrderId(orderId: string): Payment | undefined {
  return Array.from(payments.values()).find((p) => p.orderId === orderId);
}

export function createPayment(orderId: string, amount: number, currency: string): Payment {
  const id = uuidv4();
  const now = new Date().toISOString();
  const payment: Payment = {
    id,
    orderId,
    amount,
    currency,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  payments.set(id, payment);
  return payment;
}

export function updatePaymentStatus(paymentId: string, status: PaymentStatus): Payment | undefined {
  const payment = payments.get(paymentId);
  if (!payment) return undefined;
  payment.status = status;
  payment.updatedAt = new Date().toISOString();
  return payment;
}

export function setStripePaymentIntent(paymentId: string, intentId: string): Payment | undefined {
  const payment = payments.get(paymentId);
  if (!payment) return undefined;
  payment.stripePaymentIntentId = intentId;
  payment.updatedAt = new Date().toISOString();
  return payment;
}
