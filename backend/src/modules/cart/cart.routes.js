import { Router } from 'express';
import { cartController } from './cart.controller.js';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemIdSchema,
  applyCouponSchema,
} from './cart.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isCustomer } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isCustomer);

router.get('/', cartController.getMine);
router.delete('/', cartController.clear);

router.post('/items', validate(addCartItemSchema), cartController.addItem);
router.patch(
  '/items/:itemId',
  validate(cartItemIdSchema, 'params'),
  validate(updateCartItemSchema),
  cartController.updateItem
);
router.delete('/items/:itemId', validate(cartItemIdSchema, 'params'), cartController.removeItem);

router.post('/coupon', validate(applyCouponSchema), cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);

export default router;
