import { z } from 'zod';
import { CUSTOMER_TYPES, CUSTOMER_SEGMENTS, GENDERS, LANGUAGES } from './customer.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const addressSchema = z.object({
  label: z.string().max(30).optional(),
  fullName: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  line1: z.string().min(3).max(300),
  line2: z.string().max(300).optional(),
  city: z.string().min(2).max(80),
  province: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(80).optional(),
  isDefault: z.boolean().optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(120).optional().or(z.literal('')),
  phone: z.string().min(7).max(30),
  alternatePhone: z.string().max(30).optional(),
  cnic: z.string().max(20).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(GENDERS).optional(),
  customerType: z.enum(CUSTOMER_TYPES).optional().default('walk_in'),
  addresses: z.array(addressSchema).optional(),
  tags: z.array(z.string().max(40)).optional(),
  preferredCategories: z.array(objectId).optional(),
  marketingOptIn: z.boolean().optional(),
  preferredLanguage: z.enum(LANGUAGES).optional(),
  source: z.string().max(60).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().omit({ customerType: true });

export const listCustomerQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  customerType: z.enum(CUSTOMER_TYPES).optional(),
  segment: z.enum(CUSTOMER_SEGMENTS).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  city: z.string().optional(),
  minSpent: z.coerce.number().nonnegative().optional(),
  sort: z.string().optional().default('-createdAt'),
});

export const customerIdSchema = z.object({ id: objectId });

// Address sub-routes
export const addAddressSchema = addressSchema;
export const addressIdSchema = z.object({ id: objectId, addressId: objectId });

// Self-service (logged-in customer accessing own profile)
export const updateOwnProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().max(120).optional().or(z.literal('')),
  phone: z.string().min(7).max(30).optional(),
  alternatePhone: z.string().max(30).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(GENDERS).optional(),
  marketingOptIn: z.boolean().optional(),
  preferredLanguage: z.enum(LANGUAGES).optional(),
  preferredCategories: z.array(objectId).optional(),
});

export const setSegmentSchema = z.object({
  segment: z.enum(CUSTOMER_SEGMENTS),
});
