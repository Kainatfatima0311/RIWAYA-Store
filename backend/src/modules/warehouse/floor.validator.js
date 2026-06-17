import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createFloorSchema = z.object({
  warehouse: objectId,
  floorNumber: z.number().int().nonnegative(),
  name: z.string().max(60).optional(),
  areaSqft: z.number().nonnegative().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateFloorSchema = createFloorSchema.partial().omit({ warehouse: true });

export const listFloorQuerySchema = z.object({
  warehouse: objectId.optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sort: z.string().optional().default('floorNumber'),
});

export const floorIdSchema = z.object({ id: objectId });
