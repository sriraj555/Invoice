import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  price: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  stock: z.number().int().min(0),
  sku: z.string().max(50).optional(),
});

export const checkInventorySchema = z.object({
  productId: z.string().uuid().or(z.string().min(1)),
  quantity: z.number().int().positive(),
});

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type CheckInventoryBody = z.infer<typeof checkInventorySchema>;
