import { z } from 'zod';
import { PAYMENT_METHODS, PAYMENT_STATUS } from './payment.model.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const recordPaymentSchema = z.object({
  order: objectId,
  amount: z.number().positive(),
  currency: z.string().max(8).optional(),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUS).optional().default('completed'),
  transactionId: z.string().max(120).optional(),
  gateway: z.string().max(60).optional(),
  cardLast4: z.string().max(4).optional(),
  cardBrand: z.string().max(20).optional(),
  bankName: z.string().max(120).optional(),
  chequeNumber: z.string().max(60).optional(),
  chequeDate: z.coerce.date().optional(),
  referenceNumber: z.string().max(100).optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export const refundPaymentSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(PAYMENT_STATUS),
  transactionId: z.string().max(120).optional(),
  gatewayResponse: z.unknown().optional(),
});

export const listPaymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  order: objectId.optional(),
  customer: objectId.optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  status: z.enum(PAYMENT_STATUS).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.string().optional().default('-paidAt'),
});

export const paymentIdSchema = z.object({ id: objectId });
