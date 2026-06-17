import { Router } from 'express';
import { financeController } from './finance.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router.get('/overview', financeController.overview);
router.get('/revenue-time-series', financeController.revenueTimeSeries);
router.get('/top-customers', financeController.topCustomers);
router.get('/top-suppliers', financeController.topSuppliers);
router.get('/receivables', financeController.receivables);
router.get('/payables', financeController.payables);

export default router;
