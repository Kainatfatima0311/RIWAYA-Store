import { Router } from 'express';
import { z } from 'zod';
import { orderController } from './order.controller.js';
import { placeOrderSchema, orderIdSchema } from './order.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isCustomer } from '../../middleware/role.middleware.js';

const router = Router();

// Public tracking by order number (no auth — anyone with the number can see status)
router.get(
  '/track/:orderNumber',
  validate(z.object({ orderNumber: z.string().min(1) }), 'params'),
  orderController.trackByNumber
);

// Customer-authenticated endpoints
router.use(protect, isCustomer);

router.post('/', validate(placeOrderSchema), orderController.placeOnline);
router.get('/me', orderController.myOrders);
router.get('/me/:id', validate(orderIdSchema, 'params'), orderController.myOrder);

export default router;
