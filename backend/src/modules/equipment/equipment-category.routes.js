import { Router } from 'express';
import { equipmentCategoryController } from './equipment-category.controller.js';
import {
  createEquipmentCategorySchema,
  updateEquipmentCategorySchema,
  listEquipmentCategoryQuerySchema,
  equipmentCategoryIdSchema,
} from './equipment-category.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router
  .route('/')
  .get(validate(listEquipmentCategoryQuerySchema, 'query'), equipmentCategoryController.list)
  .post(validate(createEquipmentCategorySchema), equipmentCategoryController.create);

router
  .route('/:id')
  .get(validate(equipmentCategoryIdSchema, 'params'), equipmentCategoryController.getOne)
  .patch(
    validate(equipmentCategoryIdSchema, 'params'),
    validate(updateEquipmentCategorySchema),
    equipmentCategoryController.update
  )
  .delete(validate(equipmentCategoryIdSchema, 'params'), equipmentCategoryController.remove);

export default router;
