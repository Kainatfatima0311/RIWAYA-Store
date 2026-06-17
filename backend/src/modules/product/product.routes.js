import { Router } from 'express';
import { productController } from './product.controller.js';
import {
  createProductSchema,
  updateProductSchema,
  listProductQuerySchema,
  productIdSchema,
  toggleDisplaySchema,
  publishProductSchema,
} from './product.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff, isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router
  .route('/')
  .get(validate(listProductQuerySchema, 'query'), productController.list)
  .post(validate(createProductSchema), productController.create);

router
  .route('/:id')
  .get(validate(productIdSchema, 'params'), productController.getOne)
  .patch(validate(productIdSchema, 'params'), validate(updateProductSchema), productController.update)
  .delete(isSuperAdmin, validate(productIdSchema, 'params'), productController.remove);

// Quick toggles
router.patch(
  '/:id/display',
  validate(productIdSchema, 'params'),
  validate(toggleDisplaySchema),
  productController.setDisplay
);
router.patch(
  '/:id/status',
  validate(productIdSchema, 'params'),
  validate(publishProductSchema),
  productController.setStatus
);

export default router;
