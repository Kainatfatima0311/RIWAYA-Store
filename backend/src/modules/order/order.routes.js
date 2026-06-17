import { Router } from 'express';
import { orderController } from './order.controller.js';
import {
  physicalOrderSchema,
  listOrderQuerySchema,
  orderIdSchema,
  transitionStatusSchema,
  updateCourierSchema,
  cancelOrderSchema,
} from './order.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router.get('/stats', orderController.stats);

router
  .route('/')
  .get(validate(listOrderQuerySchema, 'query'), orderController.list)
  .post(validate(physicalOrderSchema), orderController.createPhysical);

router.get('/:id', validate(orderIdSchema, 'params'), orderController.getOne);

router.post(
  '/:id/transition',
  validate(orderIdSchema, 'params'),
  validate(transitionStatusSchema),
  orderController.transition
);

router.post(
  '/:id/cancel',
  validate(orderIdSchema, 'params'),
  validate(cancelOrderSchema),
  orderController.cancel
);

router.patch(
  '/:id/courier',
  validate(orderIdSchema, 'params'),
  validate(updateCourierSchema),
  orderController.updateCourier
);

export default router;
