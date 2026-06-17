import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createEquipmentCategorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  icon: z.string().max(60).optional(),
  color: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

export const updateEquipmentCategorySchema = createEquipmentCategorySchema.partial();

export const listEquipmentCategoryQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  sort: z.string().optional().default('name'),
});

export const equipmentCategoryIdSchema = z.object({ id: objectId });
