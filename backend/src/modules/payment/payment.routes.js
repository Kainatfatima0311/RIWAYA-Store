import { Router } from 'express';
import { z } from 'zod';
import { paymentController } from './payment.controller.js';
import {
  recordPaymentSchema,
  refundPaymentSchema,
  updatePaymentStatusSchema,
  listPaymentQuerySchema,
  paymentIdSchema,
} from './payment.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff, isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router.get('/stats', paymentController.stats);

router
  .route('/')
  .get(validate(listPaymentQuerySchema, 'query'), paymentController.list)
  .post(validate(recordPaymentSchema), paymentController.record);

router.get(
  '/by-order/:orderId',
  validate(z.object({ orderId: z.string().regex(/^[0-9a-fA-F]{24}$/) }), 'params'),
  paymentController.listForOrder
);

router.get('/:id', validate(paymentIdSchema, 'params'), paymentController.getOne);

router.patch(
  '/:id/status',
  validate(paymentIdSchema, 'params'),
  validate(updatePaymentStatusSchema),
  paymentController.updateStatus
);

router.post(
  '/:id/refund',
  isSuperAdmin,
  validate(paymentIdSchema, 'params'),
  validate(refundPaymentSchema),
  paymentController.refund
);

export default router;
