import type { Product } from "./types";
import { v4 as uuidv4 } from "uuid";

const products = new Map<string, Product>([
  [
    "p1",
    {
      id: "p1",
      name: "Wireless Mouse",
      description: "Ergonomic wireless mouse",
      price: 29.99,
      currency: "USD",
      stock: 100,
      sku: "WM-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    "p2",
    {
      id: "p2",
      name: "USB-C Hub",
      description: "7-in-1 USB-C hub",
      price: 49.99,
      currency: "USD",
      stock: 50,
      sku: "HUB-002",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

export function getAllProducts(): Product[] {
  return Array.from(products.values());
}

export function getProductById(id: string): Product | undefined {
  return products.get(id);
}

export function createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
  const id = uuidv4();
  const now = new Date().toISOString();
  const product: Product = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  };
  products.set(id, product);
  return product;
}

export function createProductWithId(
  id: string,
  input: Omit<Product, "id" | "createdAt" | "updatedAt">
): Product {
  const now = new Date().toISOString();
  const product: Product = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  };
  products.set(id, product);
  return product;
}

export function updateProduct(id: string, updates: Partial<Omit<Product, "id" | "createdAt">>): Product | undefined {
  const existing = products.get(id);
  if (!existing) return undefined;
  const updated: Product = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  products.set(id, updated);
  return updated;
}

export function deleteProduct(id: string): boolean {
  return products.delete(id);
}

export function checkStock(productId: string, quantity: number): boolean {
  const p = products.get(productId);
  return p ? p.stock >= quantity : false;
}

export function reserveStock(productId: string, quantity: number): boolean {
  const p = products.get(productId);
  if (!p || p.stock < quantity) return false;
  p.stock -= quantity;
  p.updatedAt = new Date().toISOString();
  products.set(productId, p);
  return true;
}

export function releaseStock(productId: string, quantity: number): void {
  const p = products.get(productId);
  if (p) {
    p.stock += quantity;
    p.updatedAt = new Date().toISOString();
    products.set(productId, p);
  }
}

export interface Recommendation {
  productId: string;
  score: number;
  comment: string;
}

export function getRecommendations(): Recommendation[] {
  const all = getAllProducts();
  return all.slice(0, 5).map((p, i) => ({
    productId: p.id,
    score: Math.min(5, 4 + (p.stock > 10 ? 1 : 0)),
    comment: `Highly rated (${p.name})`,
  }));
}
