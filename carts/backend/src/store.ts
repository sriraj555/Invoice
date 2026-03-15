import type { Cart, CartItem } from "./types";
import { v4 as uuidv4 } from "uuid";

const carts = new Map<string, Cart>();

const DEFAULT_DISCOUNTS: Record<string, number> = {
  SAVE10: 10,
  SAVE20: 20,
};

export function getCart(cartId: string): Cart | undefined {
  return carts.get(cartId);
}

export function getCartByUserId(userId: string): Cart | undefined {
  return Array.from(carts.values()).find((c) => c.userId === userId);
}

export function createCart(userId: string): Cart {
  const id = uuidv4();
  const now = new Date().toISOString();
  const cart: Cart = {
    id,
    userId,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  carts.set(id, cart);
  return cart;
}

export function getOrCreateCart(userId: string): Cart {
  const existing = getCartByUserId(userId);
  if (existing) return existing;
  return createCart(userId);
}

export function addItem(cartId: string, item: CartItem): Cart | undefined {
  const cart = carts.get(cartId);
  if (!cart) return undefined;
  const existing = cart.items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
    if (item.price !== undefined) existing.price = item.price;
    if (item.name !== undefined) existing.name = item.name;
  } else {
    cart.items.push({ ...item });
  }
  cart.updatedAt = new Date().toISOString();
  return cart;
}

export function updateItem(cartId: string, productId: string, quantity: number): Cart | undefined {
  const cart = carts.get(cartId);
  if (!cart) return undefined;
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return undefined;
  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.productId !== productId);
  } else {
    item.quantity = quantity;
  }
  cart.updatedAt = new Date().toISOString();
  return cart;
}

export function removeItem(cartId: string, productId: string): Cart | undefined {
  return updateItem(cartId, productId, 0);
}

export function applyDiscount(cartId: string, code: string): Cart | undefined {
  const cart = carts.get(cartId);
  if (!cart) return undefined;
  const percent = DEFAULT_DISCOUNTS[code.toUpperCase()];
  if (percent === undefined) return undefined;
  cart.discountCode = code.toUpperCase();
  cart.discountPercent = percent;
  cart.updatedAt = new Date().toISOString();
  return cart;
}

export function getDiscountPercent(code: string): number | undefined {
  return DEFAULT_DISCOUNTS[code.toUpperCase()];
}

export function clearCart(cartId: string): boolean {
  const cart = carts.get(cartId);
  if (!cart) return false;
  cart.items = [];
  cart.discountCode = undefined;
  cart.discountPercent = undefined;
  cart.updatedAt = new Date().toISOString();
  return true;
}
