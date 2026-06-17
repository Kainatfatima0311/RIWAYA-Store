import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { paymentService } from './payment.service.js';

export const paymentController = {
  record: asyncHandler(async (req, res) => {
    const p = await paymentService.record(req.body, req.user._id);
    created(res, p, 'Payment recorded');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await paymentService.list(req.query);
    paginated(res, items, page, limit, total, 'Payments fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const p = await paymentService.getById(req.params.id);
    ok(res, p, 'Payment fetched');
  }),

  listForOrder: asyncHandler(async (req, res) => {
    const items = await paymentService.listForOrder(req.params.orderId);
    ok(res, items, 'Order payments fetched');
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const p = await paymentService.updateStatus(req.params.id, req.body, req.user._id);
    ok(res, p, `Payment status updated to '${p.status}'`);
  }),

  refund: asyncHandler(async (req, res) => {
    const p = await paymentService.refund(req.params.id, req.body.reason, req.user._id);
    ok(res, p, 'Payment refunded');
  }),

  stats: asyncHandler(async (req, res) => {
    const data = await paymentService.stats(req.query);
    ok(res, data, 'Payment statistics');
  }),
};
