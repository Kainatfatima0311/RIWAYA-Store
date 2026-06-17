import { z } from 'zod';
import { ORDER_TYPES, ORDER_STATUS, SHIPPING_METHODS } from './order.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const addressSchema = z.object({
  fullName: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  line1: z.string().min(3).max(300),
  line2: z.string().max(300).optional(),
  city: z.string().min(2).max(80),
  province: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(80).optional(),
});

const orderItemInputSchema = z.object({
  product: objectId,
  variantId: objectId,    // sub-doc id from product.variants
  quantity: z.number().int().positive(),
});

// ===== Online order (customer placing via storefront) =====
export const placeOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'At least one item required'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(), // defaults to shipping
  shippingMethod: z.enum(SHIPPING_METHODS).optional(),
  shippingFee: z.number().nonnegative().optional(),
  discountCode: z.string().max(40).optional(),
  customerNotes: z.string().max(1000).optional(),
  // Payment captured at checkout — stored as 'pending' until admin verifies (industry-standard flow)
  payment: z
    .object({
      method: z.enum(['cod', 'bank_transfer', 'jazzcash', 'easypaisa', 'stripe', 'card', 'cheque', 'other']),
      reference: z.string().max(100).optional(),   // txn id / cheque #
      screenshot: z.string().max(500).optional(),  // optional receipt screenshot URL
      notes: z.string().max(300).optional(),
    })
    .optional(),
});

// ===== Physical / walk-in order (manager placing for walk-in customer) =====
export const physicalOrderSchema = z.object({
  customer: objectId, // existing customer record
  items: z.array(orderItemInputSchema).min(1),
  shippingFee: z.number().nonnegative().optional().default(0),
  discount: z.number().nonnegative().optional().default(0),
  taxRate: z.number().min(0).max(100).optional(),
  storeLocation: z.string().max(200).optional(),
  warehouse: objectId.optional(),
  customerNotes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
});

export const listOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  orderType: z.enum(ORDER_TYPES).optional(),
  status: z.enum(ORDER_STATUS).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid', 'partially_refunded', 'refunded']).optional(),
  customer: objectId.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.string().optional().default('-orderedAt'),
});

export const orderIdSchema = z.object({ id: objectId });
export const orderNumberSchema = z.object({ orderNumber: z.string().min(1) });

export const transitionStatusSchema = z.object({
  status: z.enum(ORDER_STATUS),
  notes: z.string().max(500).optional(),
});

export const updateCourierSchema = z.object({
  name: z.string().max(80).optional(),
  trackingNumber: z.string().max(80).optional(),
  trackingUrl: z.string().url().max(300).optional().or(z.literal('')),
  estimatedDelivery: z.coerce.date().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const returnOrderSchema = z.object({
  reason: z.string().min(3).max(500),
});
