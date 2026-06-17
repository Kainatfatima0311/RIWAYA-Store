import { Router } from 'express';
import { rackController } from './rack.controller.js';
import {
  createRackSchema,
  updateRackSchema,
  listRackQuerySchema,
  rackIdSchema,
} from './rack.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';

const router = Router();

router.use(protect, isStaff);

router
  .route('/')
  .get(validate(listRackQuerySchema, 'query'), rackController.list)
  .post(validate(createRackSchema), rackController.create);

router
  .route('/:id')
  .get(validate(rackIdSchema, 'params'), rackController.getOne)
  .patch(validate(rackIdSchema, 'params'), validate(updateRackSchema), rackController.update)
  .delete(validate(rackIdSchema, 'params'), rackController.remove);

export default router;
