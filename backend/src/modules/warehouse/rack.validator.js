import { z } from 'zod';
import { RACK_TYPES } from './rack.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createRackSchema = z.object({
  warehouse: objectId,
  floor: objectId,
  rackCategory: objectId,
  code: z.string().min(1).max(30),
  name: z.string().max(80).optional(),
  type: z.enum(RACK_TYPES).optional(),
  capacity: z.number().nonnegative(),
  position: z
    .object({
      row: z.number().int().nonnegative().optional(),
      column: z.number().int().nonnegative().optional(),
    })
    .optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateRackSchema = createRackSchema.partial().omit({ warehouse: true });

export const listRackQuerySchema = z.object({
  warehouse: objectId.optional(),
  floor: objectId.optional(),
  rackCategory: objectId.optional(),
  type: z.enum(RACK_TYPES).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
  sort: z.string().optional().default('code'),
});

export const rackIdSchema = z.object({ id: objectId });
