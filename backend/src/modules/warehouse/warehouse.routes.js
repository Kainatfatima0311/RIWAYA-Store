import { Router } from 'express';
import { warehouseController } from './warehouse.controller.js';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  listWarehouseQuerySchema,
  idParamSchema,
} from './warehouse.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff, isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();

// All warehouse routes require staff (admin or super_admin)
router.use(protect, isStaff);

router
  .route('/')
  .get(validate(listWarehouseQuerySchema, 'query'), warehouseController.list)
  .post(validate(createWarehouseSchema), warehouseController.create);

router.get('/:id', validate(idParamSchema, 'params'), warehouseController.getOne);
router.get('/:id/summary', validate(idParamSchema, 'params'), warehouseController.summary);

router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateWarehouseSchema),
  warehouseController.update
);

// Deletion restricted to super_admin
router.delete('/:id', isSuperAdmin, validate(idParamSchema, 'params'), warehouseController.remove);

export default router;
