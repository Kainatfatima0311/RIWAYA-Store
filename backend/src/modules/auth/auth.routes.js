import { Router } from 'express';
import { authController } from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  createStaffSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();

// Public
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Protected (any logged-in user)
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, validate(updateProfileSchema), authController.updateMe);
router.post('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

// Super admin only
router.post('/create-staff', protect, isSuperAdmin, validate(createStaffSchema), authController.createStaff);

export default router;
