import { z } from 'zod';
import { PO_STATUS, PAYMENT_METHODS } from './purchase-order.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const poItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  sku: z.string().max(80).optional(),
  variant: z.string().max(120).optional(),
  unit: z.string().max(20).optional(),
  quantityOrdered: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createPurchaseOrderSchema = z.object({
  supplier: objectId,
  warehouse: objectId,
  orderDate: z.coerce.date().optional(),
  expectedDeliveryDate: z.coerce.date().optional(),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
  taxRate: z.number().min(0).max(100).optional(),
  shippingCost: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  currency: z.string().max(8).optional(),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
});

// Update allowed only when status === 'draft' (enforced in service)
export const updatePurchaseOrderSchema = createPurchaseOrderSchema
  .partial()
  .omit({ supplier: true, warehouse: true });

export const listPurchaseOrderQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  supplier: objectId.optional(),
  warehouse: objectId.optional(),
  status: z.enum(PO_STATUS).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.string().optional().default('-orderDate'),
});

export const poIdSchema = z.object({ id: objectId });

// ===== Receipt =====
const receiptItemInputSchema = z.object({
  poItem: objectId,
  quantity: z.number().int().positive(),
  notes: z.string().max(300).optional(),
});

export const addReceiptSchema = z.object({
  receivedAt: z.coerce.date().optional(),
  items: z.array(receiptItemInputSchema).min(1, 'At least one item must be received'),
  notes: z.string().max(500).optional(),
  documentUrl: z.string().max(500).optional(),
});

// ===== Payment =====
export const addPaymentSchema = z.object({
  paidAt: z.coerce.date().optional(),
  amount: z.number().positive(),
  method: z.enum(PAYMENT_METHODS).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
});

// ===== Cancel =====
export const cancelPoSchema = z.object({
  reason: z.string().min(3).max(500),
});

// Sub-id params (for delete receipt / payment)
export const subIdSchema = z.object({
  id: objectId,
  subId: objectId,
});
