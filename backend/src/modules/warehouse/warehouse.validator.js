import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const locationSchema = z.object({
  address: z.string().min(3).max(300),
  area: z.string().max(120).optional(),
  city: z.string().min(2).max(80),
  province: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const createWarehouseSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(20),
  location: locationSchema,
  areaMarla: z.number().nonnegative().optional(),
  areaSqft: z.number().nonnegative().optional(),
  totalFloors: z.number().int().nonnegative().optional(),
  storageCapacity: z.number().nonnegative().optional(),
  manager: objectId.optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const listWarehouseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  city: z.string().optional(),
  sort: z.string().optional().default('-createdAt'),
});

export const idParamSchema = z.object({ id: objectId });
