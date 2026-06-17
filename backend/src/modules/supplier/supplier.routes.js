import { Router } from 'express';
import { supplierController } from './supplier.controller.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
  listSupplierQuerySchema,
  supplierIdSchema,
} from './supplier.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff, isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router
  .route('/')
  .get(validate(listSupplierQuerySchema, 'query'), supplierController.list)
  .post(validate(createSupplierSchema), supplierController.create);

router
  .route('/:id')
  .get(validate(supplierIdSchema, 'params'), supplierController.getOne)
  .patch(validate(supplierIdSchema, 'params'), validate(updateSupplierSchema), supplierController.update)
  .delete(isSuperAdmin, validate(supplierIdSchema, 'params'), supplierController.remove);

export default router;
