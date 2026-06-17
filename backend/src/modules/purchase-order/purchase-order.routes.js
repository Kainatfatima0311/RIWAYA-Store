import { Router } from 'express';
import { purchaseOrderController } from './purchase-order.controller.js';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  listPurchaseOrderQuerySchema,
  poIdSchema,
  addReceiptSchema,
  addPaymentSchema,
  cancelPoSchema,
  subIdSchema,
} from './purchase-order.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff, isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router.get('/stats', purchaseOrderController.stats);

router
  .route('/')
  .get(validate(listPurchaseOrderQuerySchema, 'query'), purchaseOrderController.list)
  .post(validate(createPurchaseOrderSchema), purchaseOrderController.create);

router
  .route('/:id')
  .get(validate(poIdSchema, 'params'), purchaseOrderController.getOne)
  .patch(validate(poIdSchema, 'params'), validate(updatePurchaseOrderSchema), purchaseOrderController.update)
  .delete(validate(poIdSchema, 'params'), purchaseOrderController.remove);

// Lifecycle actions
router.post('/:id/approve', validate(poIdSchema, 'params'), purchaseOrderController.approve);
router.post(
  '/:id/cancel',
  validate(poIdSchema, 'params'),
  validate(cancelPoSchema),
  purchaseOrderController.cancel
);

// Receipts
router.post(
  '/:id/receipts',
  validate(poIdSchema, 'params'),
  validate(addReceiptSchema),
  purchaseOrderController.addReceipt
);
router.delete(
  '/:id/receipts/:subId',
  isSuperAdmin,
  validate(subIdSchema, 'params'),
  purchaseOrderController.removeReceipt
);

// Payments
router.post(
  '/:id/payments',
  validate(poIdSchema, 'params'),
  validate(addPaymentSchema),
  purchaseOrderController.addPayment
);
router.delete(
  '/:id/payments/:subId',
  isSuperAdmin,
  validate(subIdSchema, 'params'),
  purchaseOrderController.removePayment
);

export default router;
