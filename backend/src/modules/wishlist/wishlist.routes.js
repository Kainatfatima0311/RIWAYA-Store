import { Router } from 'express';
import { wishlistController } from './wishlist.controller.js';
import {
  addWishlistItemSchema,
  wishlistItemIdSchema,
  productIdParamSchema,
} from './wishlist.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isCustomer } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isCustomer);

router.get('/', wishlistController.getMine);
router.delete('/', wishlistController.clear);

router.post('/items', validate(addWishlistItemSchema), wishlistController.addItem);
router.delete('/items/:itemId', validate(wishlistItemIdSchema, 'params'), wishlistController.removeItem);

router.delete(
  '/products/:productId',
  validate(productIdParamSchema, 'params'),
  wishlistController.removeByProduct
);
router.get(
  '/check/:productId',
  validate(productIdParamSchema, 'params'),
  wishlistController.check
);

export default router;
