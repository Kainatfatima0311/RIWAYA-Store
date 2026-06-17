import { z } from 'zod';
import { SUPPLIER_TYPES } from './supplier.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const addressSchema = z.object({
  line1: z.string().max(300).optional(),
  line2: z.string().max(300).optional(),
  city: z.string().max(80).optional(),
  province: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
});

const bankSchema = z.object({
  bankName: z.string().max(120).optional(),
  accountTitle: z.string().max(120).optional(),
  accountNumber: z.string().max(40).optional(),
  iban: z.string().max(40).optional(),
  branchCode: z.string().max(20).optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(150),
  code: z.string().min(2).max(20).optional(), // auto-generated if absent
  type: z.enum(SUPPLIER_TYPES).optional(),
  contactPerson: z.string().max(120).optional(),
  phone: z.string().min(7).max(30),
  alternatePhone: z.string().max(30).optional(),
  email: z.string().email().max(120).optional().or(z.literal('')),
  website: z.string().max(200).optional(),
  address: addressSchema.optional(),
  ntn: z.string().max(30).optional(),
  gst: z.string().max(30).optional(),
  cnic: z.string().max(20).optional(),
  bank: bankSchema.optional(),
  paymentTerms: z.string().max(120).optional(),
  creditLimit: z.number().nonnegative().optional(),
  currency: z.string().max(8).optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(40)).optional(),
  isActive: z.boolean().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial().omit({ code: true });

export const listSupplierQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(20),
  search: z.string().optional(),
  type: z.enum(SUPPLIER_TYPES).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  city: z.string().optional(),
  sort: z.string().optional().default('-createdAt'),
});

export const supplierIdSchema = z.object({ id: objectId });
