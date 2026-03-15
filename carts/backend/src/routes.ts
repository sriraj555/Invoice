import { Router, Request, Response } from "express";
import {
  getCart,
  getOrCreateCart,
  addItem,
  updateItem,
  removeItem,
  applyDiscount,
  getDiscountPercent,
  clearCart,
} from "./store";
import { addCartItemSchema, updateCartItemSchema, applyDiscountSchema } from "./validation";
import { fetchProduct } from "./service";

const router = Router();

function subtotal(items: Array<{ quantity: number; price?: number }>): number {
  return items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
}

router.get("/cart/:cartId", (req: Request, res: Response) => {
  const cart = getCart(req.params.cartId);
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  const sub = subtotal(cart.items);
  const discount = cart.discountPercent ? (sub * cart.discountPercent) / 100 : 0;
  res.json({
    ...cart,
    subtotal: sub,
    discountAmount: discount,
    total: Math.max(0, sub - discount),
  });
});

router.get("/cart/summary/:cartId", (req: Request, res: Response) => {
  const cart = getCart(req.params.cartId);
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  const sub = subtotal(cart.items);
  const discount = cart.discountPercent ? (sub * cart.discountPercent) / 100 : 0;
  res.json({
    cartId: cart.id,
    itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
    subtotal: sub,
    discountCode: cart.discountCode,
    discountPercent: cart.discountPercent,
    discountAmount: discount,
    total: Math.max(0, sub - discount),
  });
});

router.post("/cart", (req: Request, res: Response) => {
  const userId = (req.body?.userId as string) ?? "anonymous";
  const cart = getOrCreateCart(userId);
  res.status(201).json(cart);
});

router.post("/cart/:cartId/items", async (req: Request, res: Response) => {
  const cart = getCart(req.params.cartId);
  if (!cart) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  const parsed = addCartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const product = await fetchProduct(parsed.data.productId);
  if (!product) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  if (product.stock < parsed.data.quantity) {
    res.status(400).json({ message: "Insufficient stock", available: product.stock });
    return;
  }
  const updated = addItem(cart.id, {
    productId: product.id,
    quantity: parsed.data.quantity,
    price: product.price,
    name: product.name,
  });
  res.json(updated);
});

router.put("/cart/:cartId/items/:productId", (req: Request, res: Response) => {
  const parsed = updateCartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const updated = updateItem(req.params.cartId, req.params.productId, parsed.data.quantity);
  if (!updated) {
    res.status(404).json({ message: "Cart or item not found" });
    return;
  }
  if (parsed.data.quantity === 0) {
    res.json({ ...updated, removed: true });
    return;
  }
  res.json(updated);
});

router.delete("/cart/:cartId/items/:productId", (req: Request, res: Response) => {
  const updated = removeItem(req.params.cartId, req.params.productId);
  if (!updated) {
    res.status(404).json({ message: "Cart or item not found" });
    return;
  }
  res.json(updated);
});

router.post("/cart/:cartId/discount", (req: Request, res: Response) => {
  const parsed = applyDiscountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
    return;
  }
  const updated = applyDiscount(req.params.cartId, parsed.data.code);
  if (!updated) {
    res.status(400).json({ message: "Cart not found or invalid discount code" });
    return;
  }
  res.json(updated);
});

router.post("/cart/:cartId/clear", (req: Request, res: Response) => {
  const ok = clearCart(req.params.cartId);
  if (!ok) {
    res.status(404).json({ message: "Cart not found" });
    return;
  }
  res.json({ message: "Cart cleared" });
});

export default router;
