import { z } from 'zod';
import { EQUIPMENT_CONDITIONS, EQUIPMENT_STATUS } from './equipment.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const vendorSchema = z.object({
  name: z.string().max(120).optional(),
  contactPerson: z.string().max(80).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(120).optional().or(z.literal('')),
  address: z.string().max(300).optional(),
});

export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(150),
  category: objectId,
  brand: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
  serialNumber: z.string().max(80).optional(),
  quantity: z.number().int().positive().optional().default(1),
  purchaseDate: z.coerce.date(),
  unitCost: z.number().nonnegative(),
  currency: z.string().max(8).optional(),
  vendor: vendorSchema.optional(),
  invoiceNumber: z.string().max(60).optional(),
  invoiceUrl: z.string().url().max(500).optional().or(z.literal('')),
  warrantyMonths: z.number().int().nonnegative().optional(),
  warehouse: objectId,
  floor: objectId.optional(),
  rack: objectId.optional(),
  assignedTo: objectId.optional(),
  condition: z.enum(EQUIPMENT_CONDITIONS).optional(),
  status: z.enum(EQUIPMENT_STATUS).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export const listEquipmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  category: objectId.optional(),
  warehouse: objectId.optional(),
  condition: z.enum(EQUIPMENT_CONDITIONS).optional(),
  status: z.enum(EQUIPMENT_STATUS).optional(),
  assignedTo: objectId.optional(),
  minCost: z.coerce.number().nonnegative().optional(),
  maxCost: z.coerce.number().nonnegative().optional(),
  purchasedFrom: z.coerce.date().optional(),
  purchasedTo: z.coerce.date().optional(),
  sort: z.string().optional().default('-purchaseDate'),
});

export const equipmentIdSchema = z.object({ id: objectId });

export const assignEquipmentSchema = z.object({
  assignedTo: objectId.nullable(),
});
