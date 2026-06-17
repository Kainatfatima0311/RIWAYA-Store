import { Router } from 'express';
import { productCategoryController } from './product-category.controller.js';
import {
  createProductCategorySchema,
  updateProductCategorySchema,
  listProductCategoryQuerySchema,
  productCategoryIdSchema,
} from './product-category.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router.get('/tree', productCategoryController.tree);

router
  .route('/')
  .get(validate(listProductCategoryQuerySchema, 'query'), productCategoryController.list)
  .post(validate(createProductCategorySchema), productCategoryController.create);

router.get('/:id/breadcrumb', validate(productCategoryIdSchema, 'params'), productCategoryController.breadcrumb);

router
  .route('/:id')
  .get(validate(productCategoryIdSchema, 'params'), productCategoryController.getOne)
  .patch(
    validate(productCategoryIdSchema, 'params'),
    validate(updateProductCategorySchema),
    productCategoryController.update
  )
  .delete(validate(productCategoryIdSchema, 'params'), productCategoryController.remove);

export default router;
