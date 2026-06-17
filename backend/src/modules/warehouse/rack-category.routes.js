import { Router } from 'express';
import { rackCategoryController } from './rack-category.controller.js';
import {
  createRackCategorySchema,
  updateRackCategorySchema,
  listRackCategoryQuerySchema,
  rackCategoryIdSchema,
} from './rack-category.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';

const router = Router();

router.use(protect, isStaff);

router
  .route('/')
  .get(validate(listRackCategoryQuerySchema, 'query'), rackCategoryController.list)
  .post(validate(createRackCategorySchema), rackCategoryController.create);

router
  .route('/:id')
  .get(validate(rackCategoryIdSchema, 'params'), rackCategoryController.getOne)
  .patch(
    validate(rackCategoryIdSchema, 'params'),
    validate(updateRackCategorySchema),
    rackCategoryController.update
  )
  .delete(validate(rackCategoryIdSchema, 'params'), rackCategoryController.remove);

export default router;
