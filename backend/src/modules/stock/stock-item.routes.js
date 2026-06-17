import { Router } from 'express';
import { stockItemController } from './stock-item.controller.js';
import {
  createStockItemSchema,
  updateStockItemSchema,
  listStockItemQuerySchema,
  stockItemIdSchema,
  receiveStockSchema,
  transferStockSchema,
  adjustStockSchema,
  writeOffStockSchema,
  listMovementQuerySchema,
} from './stock-item.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff, isSuperAdmin } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

// Low-stock alerts
router.get('/low-stock', stockItemController.lowStock);

// CRUD
router
  .route('/')
  .get(validate(listStockItemQuerySchema, 'query'), stockItemController.list)
  .post(validate(createStockItemSchema), stockItemController.create);

router
  .route('/:id')
  .get(validate(stockItemIdSchema, 'params'), stockItemController.getOne)
  .patch(validate(stockItemIdSchema, 'params'), validate(updateStockItemSchema), stockItemController.update)
  .delete(isSuperAdmin, validate(stockItemIdSchema, 'params'), stockItemController.remove);

// Drill-downs
router.get('/:id/entries', validate(stockItemIdSchema, 'params'), stockItemController.entries);
router.get(
  '/:id/movements',
  validate(stockItemIdSchema, 'params'),
  validate(listMovementQuerySchema, 'query'),
  stockItemController.movements
);

// Operations
router.post(
  '/:id/receive',
  validate(stockItemIdSchema, 'params'),
  validate(receiveStockSchema),
  stockItemController.receive
);
router.post(
  '/:id/transfer',
  validate(stockItemIdSchema, 'params'),
  validate(transferStockSchema),
  stockItemController.transfer
);
router.post(
  '/:id/adjust',
  validate(stockItemIdSchema, 'params'),
  validate(adjustStockSchema),
  stockItemController.adjust
);
router.post(
  '/:id/write-off',
  validate(stockItemIdSchema, 'params'),
  validate(writeOffStockSchema),
  stockItemController.writeOff
);

export default router;
