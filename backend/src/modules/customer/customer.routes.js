import { Router } from 'express';
import { customerController } from './customer.controller.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomerQuerySchema,
  customerIdSchema,
  addAddressSchema,
  addressIdSchema,
  updateOwnProfileSchema,
  setSegmentSchema,
} from './customer.validator.js';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff, isCustomer, isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();

// ===== Self-service routes (logged-in customer) =====
router.get('/me', protect, isCustomer, customerController.getMyProfile);
router.patch('/me', protect, isCustomer, validate(updateOwnProfileSchema), customerController.updateMyProfile);
router.post('/me/addresses', protect, isCustomer, validate(addAddressSchema), customerController.addMyAddress);
router.patch(
  '/me/addresses/:addressId',
  protect,
  isCustomer,
  validate(z.object({ addressId: z.string().regex(/^[0-9a-fA-F]{24}$/) }), 'params'),
  validate(addAddressSchema.partial()),
  customerController.updateMyAddress
);
router.delete(
  '/me/addresses/:addressId',
  protect,
  isCustomer,
  validate(z.object({ addressId: z.string().regex(/^[0-9a-fA-F]{24}$/) }), 'params'),
  customerController.removeMyAddress
);

// ===== Admin routes =====
router.use(protect, isStaff);

router
  .route('/')
  .get(validate(listCustomerQuerySchema, 'query'), customerController.list)
  .post(validate(createCustomerSchema), customerController.create);

router
  .route('/:id')
  .get(validate(customerIdSchema, 'params'), customerController.getOne)
  .patch(validate(customerIdSchema, 'params'), validate(updateCustomerSchema), customerController.update)
  .delete(isSuperAdmin, validate(customerIdSchema, 'params'), customerController.remove);

router.patch(
  '/:id/segment',
  validate(customerIdSchema, 'params'),
  validate(setSegmentSchema),
  customerController.setSegment
);

// Addresses (admin)
router.post(
  '/:id/addresses',
  validate(customerIdSchema, 'params'),
  validate(addAddressSchema),
  customerController.addAddress
);
router.patch(
  '/:id/addresses/:addressId',
  validate(addressIdSchema, 'params'),
  validate(addAddressSchema.partial()),
  customerController.updateAddress
);
router.delete(
  '/:id/addresses/:addressId',
  validate(addressIdSchema, 'params'),
  customerController.removeAddress
);

export default router;
