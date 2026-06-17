import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const addCartItemSchema = z.object({
  product: objectId,
  variantId: objectId,
  quantity: z.number().int().positive().max(100).optional().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100),
});

export const applyCouponSchema = z.object({
  couponCode: z.string().min(1).max(40),
});

export const cartItemIdSchema = z.object({
  itemId: objectId,
});
