import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

export const cartIdParamSchema = z.object({ cartId: z.string().uuid().or(z.string().min(1)) });
export const applyDiscountSchema = z.object({ code: z.string().min(1) });

export type AddCartItemBody = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemBody = z.infer<typeof updateCartItemSchema>;
