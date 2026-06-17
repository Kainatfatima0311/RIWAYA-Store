import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';

const router = Router();
router.use(protect, isStaff);

router.get('/dashboard', reportsController.dashboard);
router.get('/sales', reportsController.sales);
router.get('/top-products', reportsController.topProducts);
router.get('/inventory', reportsController.inventory);
router.get('/stock-value', reportsController.stockValue);
router.get('/activity-feed', reportsController.activityFeed);

export default router;
