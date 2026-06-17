import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { reportsService } from './reports.service.js';

export const reportsController = {
  dashboard: asyncHandler(async (req, res) => {
    const data = await reportsService.dashboard();
    ok(res, data, 'Dashboard snapshot');
  }),

  sales: asyncHandler(async (req, res) => {
    const data = await reportsService.salesReport(req.query);
    ok(res, data, 'Sales report');
  }),

  topProducts: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const data = await reportsService.topProducts({ ...req.query, limit });
    ok(res, data, 'Top products');
  }),

  inventory: asyncHandler(async (req, res) => {
    const data = await reportsService.inventoryReport({
      ...req.query,
      lowStockOnly: req.query.lowStockOnly === 'true',
    });
    ok(res, data, 'Inventory report');
  }),

  activityFeed: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 30, 200);
    const data = await reportsService.activityFeed({ limit });
    ok(res, data, 'Activity feed');
  }),

  stockValue: asyncHandler(async (req, res) => {
    const data = await reportsService.stockValueReport();
    ok(res, data, 'Stock value report');
  }),
};
