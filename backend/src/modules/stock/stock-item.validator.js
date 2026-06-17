import { z } from 'zod';
import { MOVEMENT_TYPES, REFERENCE_KINDS } from './stock-movement.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const variantSchema = z.object({
  color: z.string().max(40).optional(),
  size: z.string().max(20).optional(),
  fabric: z.string().max(60).optional(),
  pattern: z.string().max(60).optional(),
  season: z.string().max(30).optional(),
  gender: z.string().max(20).optional(),
});

export const createStockItemSchema = z.object({
  name: z.string().min(2).max(200),
  sku: z.string().min(2).max(40).optional(), // auto-generated if missing
  barcode: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  rackCategory: objectId.optional(),
  defaultRack: objectId.optional(),
  supplier: objectId.optional(),
  unit: z.string().max(20).optional(),
  currency: z.string().max(8).optional(),
  unitCost: z.number().nonnegative().optional(),
  variant: variantSchema.optional(),
  minStockLevel: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  maxStockLevel: z.number().nonnegative().optional(),
  tags: z.array(z.string().max(40)).optional(),
  isActive: z.boolean().optional(),
});

export const updateStockItemSchema = createStockItemSchema.partial();

export const listStockItemQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(20),
  search: z.string().optional(),
  rackCategory: objectId.optional(),
  supplier: objectId.optional(),
  isActive: z.enum(['true', 'false']).optional(),
  stockStatus: z.enum(['out_of_stock', 'urgent', 'low', 'ok']).optional(),
  sort: z.string().optional().default('-updatedAt'),
});

export const stockItemIdSchema = z.object({ id: objectId });

// ===== Operations =====

export const receiveStockSchema = z.object({
  rack: objectId,
  quantity: z.number().int().positive(),
  unitCost: z.number().nonnegative().optional(),
  reason: z.string().max(300).optional(),
  reference: z
    .object({
      kind: z.enum(REFERENCE_KINDS).optional(),
      id: objectId.optional(),
      label: z.string().max(60).optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});

export const transferStockSchema = z.object({
  fromRack: objectId,
  toRack: objectId,
  quantity: z.number().int().positive(),
  reason: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});

export const adjustStockSchema = z.object({
  rack: objectId,
  delta: z.number().int(), // can be positive or negative
  reason: z.string().min(3).max(300),
  notes: z.string().max(500).optional(),
});

export const writeOffStockSchema = z.object({
  rack: objectId,
  quantity: z.number().int().positive(),
  reason: z.string().min(3).max(300),
  notes: z.string().max(500).optional(),
});

// ===== Movement query =====
export const listMovementQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
  stockItem: objectId.optional(),
  warehouse: objectId.optional(),
  rack: objectId.optional(),
  type: z.enum(MOVEMENT_TYPES).optional(),
  referenceKind: z.enum(REFERENCE_KINDS).optional(),
  referenceId: objectId.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.string().optional().default('-performedAt'),
});
