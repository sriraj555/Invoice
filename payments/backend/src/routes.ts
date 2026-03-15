import { Router, Request, Response } from "express";
import { getPayment, createPayment, updatePaymentStatus } from "./store";
import { validatePaymentSchema, confirmPaymentSchema } from "./validation";
import { confirmPaymentWithOrderApi, validateStripePrice } from "./service";
import { getCartSummary } from "./cartClient";

const router = Router();

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
    if (cartSummary && Math.abs(cartSummary.total - parsed.data.amount) > 0.01) {
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
    if (cartSummary && Math.abs(cartSummary.total - parsed.data.amount) > 0.01) {
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
