import { Router } from 'express';
import { equipmentController } from './equipment.controller.js';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  listEquipmentQuerySchema,
  equipmentIdSchema,
  assignEquipmentSchema,
} from './equipment.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff, isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router.get('/spend-summary', equipmentController.spendSummary);

router
  .route('/')
  .get(validate(listEquipmentQuerySchema, 'query'), equipmentController.list)
  .post(validate(createEquipmentSchema), equipmentController.create);

router
  .route('/:id')
  .get(validate(equipmentIdSchema, 'params'), equipmentController.getOne)
  .patch(validate(equipmentIdSchema, 'params'), validate(updateEquipmentSchema), equipmentController.update)
  .delete(isSuperAdmin, validate(equipmentIdSchema, 'params'), equipmentController.remove);

router.post(
  '/:id/assign',
  validate(equipmentIdSchema, 'params'),
  validate(assignEquipmentSchema),
  equipmentController.assign
);

export default router;
