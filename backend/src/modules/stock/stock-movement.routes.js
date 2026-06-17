import { Router } from 'express';
import { stockMovementController } from './stock-movement.controller.js';
import { listMovementQuerySchema } from './stock-item.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router.get('/', validate(listMovementQuerySchema, 'query'), stockMovementController.list);

export default router;
