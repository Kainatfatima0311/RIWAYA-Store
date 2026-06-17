import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/ApiResponse.js';
import { financeService } from './finance.service.js';

export const financeController = {
  overview: asyncHandler(async (req, res) => {
    const data = await financeService.overview(req.query);
    ok(res, data, 'Finance overview');
  }),

  revenueTimeSeries: asyncHandler(async (req, res) => {
    const data = await financeService.revenueTimeSeries(req.query);
    ok(res, data, 'Revenue time series');
  }),

  topCustomers: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const data = await financeService.topCustomers({ ...req.query, limit });
    ok(res, data, 'Top customers');
  }),

  topSuppliers: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const data = await financeService.topSuppliers({ limit });
    ok(res, data, 'Top suppliers');
  }),

  receivables: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const data = await financeService.receivables({ limit });
    ok(res, data, 'Outstanding receivables');
  }),

  payables: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const data = await financeService.payables({ limit });
    ok(res, data, 'Outstanding payables');
  }),
};
