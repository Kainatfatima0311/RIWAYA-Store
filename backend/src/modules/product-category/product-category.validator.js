import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createProductCategorySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  parent: objectId.nullable().optional(),
  image: z.object({ url: z.string(), publicId: z.string().optional() }).optional(),
  icon: z.string().max(60).optional(),
  color: z.string().max(20).optional(),
  displayOnFrontend: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateProductCategorySchema = createProductCategorySchema.partial();

export const listProductCategoryQuerySchema = z.object({
  search: z.string().optional(),
  parent: z.union([objectId, z.literal('root')]).optional(),
  displayOnFrontend: z.enum(['true', 'false']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  isFeatured: z.enum(['true', 'false']).optional(),
  sort: z.string().optional().default('displayOrder name'),
});

export const productCategoryIdSchema = z.object({ id: objectId });
export const productCategorySlugSchema = z.object({ slug: z.string().min(1) });
