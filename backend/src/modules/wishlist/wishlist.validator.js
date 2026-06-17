import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const addWishlistItemSchema = z.object({
  product: objectId,
  notes: z.string().max(200).optional(),
});

export const wishlistItemIdSchema = z.object({
  itemId: objectId,
});

export const productIdParamSchema = z.object({
  productId: objectId,
});
