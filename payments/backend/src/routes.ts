import { Router, Request, Response } from "express";
import { getPayment, getAllPayments, createPayment, updatePaymentStatus, setStripePaymentIntent } from "./store";
import { validatePaymentSchema, confirmPaymentSchema, createIntentSchema, confirmStripeSchema } from "./validation";
import { confirmPaymentWithOrderApi, validateStripePrice } from "./service";
import { getCartSummary } from "./cartClient";
import { sendPaymentEvent } from "./sqsClient";
import { getStripe } from "./stripeClient";
import { env } from "./env";

const router = Router();

// --- Stripe PaymentIntent flow ---

// Returns the publishable key so the frontend can initialise Stripe.js
router.get("/payments/config", (_req: Request, res: Response) => {
  res.json({ publishableKey: env.stripePublishableKey });
});

// Step 1: Create a Stripe PaymentIntent + internal payment record
router.post("/payments/create-intent", async (req: Request, res: Response) => {
  const parsed = createIntentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }

  const { orderId, amount, currency, cartId, userEmail } = parsed.data;

  if (!validateStripePrice(amount, currency)) {
    res.status(400).json({ message: "Amount below Stripe minimum for this currency" });
    return;
  }

  // Validate against cart total if cartId provided
  if (cartId) {
    const cartSummary = await getCartSummary(cartId);
    if (cartSummary && cartSummary.total > 0 && Math.abs(cartSummary.total - amount) > 0.01) {
      res.status(400).json({ message: "Amount does not match cart total", cartTotal: cartSummary.total });
      return;
    }
  }

  try {
    const stripe = getStripe();

    // Stripe expects amount in smallest currency unit (cents for USD)
    const stripeAmount = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: currency.toLowerCase(),
      metadata: { orderId, ...(cartId && { cartId }), ...(userEmail && { userEmail }) },
    });

    // Create internal payment record
    const payment = createPayment(orderId, amount, currency);
    setStripePaymentIntent(payment.id, paymentIntent.id);

    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
      orderId,
      amount,
      currency,
    });
  } catch (err) {
    console.error("Stripe create-intent error:", err);
    res.status(500).json({
      message: "Failed to create payment intent",
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// Step 2: After frontend confirms with Stripe.js, verify and complete the payment
router.post("/payments/confirm-stripe", async (req: Request, res: Response) => {
  const parsed = confirmStripeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }

  const { paymentIntentId, paymentId, orderId, userEmail } = parsed.data;

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "succeeded") {
      res.status(400).json({
        message: `Payment not completed. Stripe status: ${intent.status}`,
        stripeStatus: intent.status,
      });
      return;
    }

    // Update internal payment status
    updatePaymentStatus(paymentId, "succeeded");

    // Confirm with Orders service
    const confirmed = await confirmPaymentWithOrderApi(orderId, paymentId, userEmail);

    // Publish event for async invoice generation
    await sendPaymentEvent({
      type: "PAYMENT_COMPLETED",
      orderId,
      paymentId,
      amount: intent.amount / 100,
      currency: intent.currency.toUpperCase(),
    });

    res.json({
      success: true,
      paymentId,
      orderId,
      stripeStatus: intent.status,
      orderConfirmed: confirmed,
    });
  } catch (err) {
    console.error("Stripe confirm error:", err);
    res.status(500).json({
      message: "Failed to confirm payment",
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// --- Existing endpoints (kept for backward compatibility) ---

// List all payments (used by frontends for dropdown selection)
router.get("/payments", (_req: Request, res: Response) => {
  const payments = getAllPayments();
  res.json(payments);
});

router.post("/payments/validate", async (req: Request, res: Response) => {
  const parsed = validatePaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  if (!validateStripePrice(parsed.data.amount, parsed.data.currency)) {
    res
      .status(400)
      .json({ message: "Invalid amount for payment", valid: false });
    return;
  }
  if (parsed.data.cartId) {
    const cartSummary = await getCartSummary(parsed.data.cartId);
    if (cartSummary && cartSummary.total > 0 && Math.abs(cartSummary.total - parsed.data.amount) > 0.01) {
      res.status(400).json({
        valid: false,
        message: "Amount does not match cart total",
        cartTotal: cartSummary.total,
      });
      return;
    }
  }
  res.json({
    valid: true,
    orderId: parsed.data.orderId,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
  });
});

router.post("/payments", async (req: Request, res: Response) => {
  const parsed = validatePaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  if (!validateStripePrice(parsed.data.amount, parsed.data.currency)) {
    res.status(400).json({ message: "Invalid amount" });
    return;
  }
  if (parsed.data.cartId) {
    const cartSummary = await getCartSummary(parsed.data.cartId);
    if (cartSummary && cartSummary.total > 0 && Math.abs(cartSummary.total - parsed.data.amount) > 0.01) {
      res.status(400).json({
        message: "Amount does not match cart total",
        cartTotal: cartSummary.total,
      });
      return;
    }
  }
  const payment = createPayment(
    parsed.data.orderId,
    parsed.data.amount,
    parsed.data.currency,
  );
  updatePaymentStatus(payment.id, "succeeded");
  const confirmed = await confirmPaymentWithOrderApi(
    parsed.data.orderId,
    payment.id,
    parsed.data.userEmail,
  );

  // Publish payment event to SQS for async invoice generation
  await sendPaymentEvent({
    type: "PAYMENT_COMPLETED",
    orderId: parsed.data.orderId,
    paymentId: payment.id,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
  });

  res.status(201).json({
    ...payment,
    status: "succeeded",
    orderConfirmed: confirmed,
  });
});

router.get("/payments/:paymentId", (req: Request, res: Response) => {
  const payment = getPayment(req.params.paymentId);
  if (!payment) {
    res.status(404).json({ message: "Payment not found" });
    return;
  }
  res.json(payment);
});

router.get("/payments/status/:paymentId", (req: Request, res: Response) => {
  const payment = getPayment(req.params.paymentId);
  if (!payment) {
    res.status(404).json({ message: "Payment not found" });
    return;
  }
  res.json({
    paymentId: payment.id,
    orderId: payment.orderId,
    status: payment.status,
  });
});

router.post("/payments/confirm", (req: Request, res: Response) => {
  const parsed = confirmPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const payment = getPayment(parsed.data.paymentId);
  if (!payment || payment.orderId !== parsed.data.orderId) {
    res
      .status(404)
      .json({ message: "Payment not found or order mismatch", success: false });
    return;
  }
  const updated = updatePaymentStatus(payment.id, "succeeded");
  res.json({
    orderId: parsed.data.orderId,
    paymentId: parsed.data.paymentId,
    success: !!updated,
  });
});

export default router;
