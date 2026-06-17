import { z } from 'zod';
import { PRODUCT_STATUS } from './product.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const imageSchema = z.object({
  url: z
    .string()
    .min(1)
    .refine(
      (v) => /^(https?:\/\/|data:image\/|\/uploads\/)/.test(v),
      'Image URL must be an http(s) URL, data URI, or /uploads/ path'
    ),
  publicId: z.string().optional(),
  alt: z.string().max(200).optional(),
  isPrimary: z.boolean().optional(),
  order: z.number().int().optional(),
});

const variantSchema = z.object({
  label: z.string().min(1).max(120),
  stockItem: objectId,
  additionalPrice: z.number().optional().default(0),
  isDefault: z.boolean().optional(),
});

const specSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(300),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  categories: z.array(objectId).min(1, 'At least one category is required'),
  brand: z.string().max(100).optional(),
  sku: z.string().max(80).optional(),
  basePrice: z.number().nonnegative(),
  salePrice: z.number().nonnegative().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currency: z.string().max(8).optional(),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
  images: z.array(imageSchema).optional(),
  video: z.string().url().optional().or(z.literal('')),
  displayOnFrontend: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  status: z.enum(PRODUCT_STATUS).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  keywords: z.array(z.string().max(40)).optional(),
  specifications: z.array(specSchema).optional(),
  tags: z.array(z.string().max(40)).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  category: objectId.optional(),
  status: z.enum(PRODUCT_STATUS).optional(),
  displayOnFrontend: z.enum(['true', 'false']).optional(),
  isFeatured: z.enum(['true', 'false']).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.string().optional().default('-updatedAt'),
});

export const productIdSchema = z.object({ id: objectId });
export const productSlugSchema = z.object({ slug: z.string().min(1) });

export const toggleDisplaySchema = z.object({
  displayOnFrontend: z.boolean(),
});

export const publishProductSchema = z.object({
  status: z.enum(PRODUCT_STATUS),
});
