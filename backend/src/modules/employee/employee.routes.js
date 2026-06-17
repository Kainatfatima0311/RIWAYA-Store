import { Router } from 'express';
import { employeeController } from './employee.controller.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeeQuerySchema,
  employeeIdSchema,
  setStatusSchema,
  linkUserSchema,
  markAttendanceSchema,
  listAttendanceQuerySchema,
} from './employee.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff, isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

// Attendance listing (across employees)
router.get(
  '/attendance/list',
  validate(listAttendanceQuerySchema, 'query'),
  employeeController.listAttendance
);

router
  .route('/')
  .get(validate(listEmployeeQuerySchema, 'query'), employeeController.list)
  .post(validate(createEmployeeSchema), employeeController.create);

router
  .route('/:id')
  .get(validate(employeeIdSchema, 'params'), employeeController.getOne)
  .patch(validate(employeeIdSchema, 'params'), validate(updateEmployeeSchema), employeeController.update)
  .delete(isSuperAdmin, validate(employeeIdSchema, 'params'), employeeController.remove);

router.patch(
  '/:id/status',
  validate(employeeIdSchema, 'params'),
  validate(setStatusSchema),
  employeeController.setStatus
);

router.patch(
  '/:id/link-user',
  isSuperAdmin,
  validate(employeeIdSchema, 'params'),
  validate(linkUserSchema),
  employeeController.linkUser
);

router.get('/:id/team', validate(employeeIdSchema, 'params'), employeeController.team);

router.post(
  '/:id/attendance',
  validate(employeeIdSchema, 'params'),
  validate(markAttendanceSchema),
  employeeController.markAttendance
);

router.get(
  '/:id/attendance/summary',
  validate(employeeIdSchema, 'params'),
  employeeController.attendanceSummary
);

export default router;
