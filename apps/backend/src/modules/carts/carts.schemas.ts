import { z } from "zod";

export const cartIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const cartItemParamsSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid()
});

export const createCartSchema = z.object({
  userId: z.string().uuid().optional()
});

export const addCartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive()
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive()
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type CreateCartInput = z.infer<typeof createCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
