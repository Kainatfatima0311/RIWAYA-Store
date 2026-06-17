import { Router } from 'express';
import { floorController } from './floor.controller.js';
import {
  createFloorSchema,
  updateFloorSchema,
  listFloorQuerySchema,
  floorIdSchema,
} from './floor.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';

const router = Router();

router.use(protect, isStaff);

router
  .route('/')
  .get(validate(listFloorQuerySchema, 'query'), floorController.list)
  .post(validate(createFloorSchema), floorController.create);

router
  .route('/:id')
  .get(validate(floorIdSchema, 'params'), floorController.getOne)
  .patch(validate(floorIdSchema, 'params'), validate(updateFloorSchema), floorController.update)
  .delete(validate(floorIdSchema, 'params'), floorController.remove);

export default router;
