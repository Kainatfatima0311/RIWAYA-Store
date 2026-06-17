import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createRackCategorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(60).optional(),
  isActive: z.boolean().optional(),
});

export const updateRackCategorySchema = createRackCategorySchema.partial();

export const listRackCategoryQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  sort: z.string().optional().default('name'),
});

export const rackCategoryIdSchema = z.object({ id: objectId });
