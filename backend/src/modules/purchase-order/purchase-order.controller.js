import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { purchaseOrderService } from './purchase-order.service.js';

export const purchaseOrderController = {
  create: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.create(req.body, req.user._id);
    created(res, po, 'Purchase order drafted');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await purchaseOrderService.list(req.query);
    paginated(res, items, page, limit, total, 'Purchase orders fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.getById(req.params.id);
    ok(res, po, 'Purchase order fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.update(req.params.id, req.body, req.user._id);
    ok(res, po, 'Purchase order updated');
  }),

  approve: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.approve(req.params.id, req.user._id);
    ok(res, po, 'Purchase order approved');
  }),

  cancel: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.cancel(req.params.id, req.body.reason, req.user._id);
    ok(res, po, 'Purchase order cancelled');
  }),

  addReceipt: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.addReceipt(req.params.id, req.body, req.user._id);
    created(res, po, 'Receipt recorded');
  }),

  removeReceipt: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.removeReceipt(req.params.id, req.params.subId);
    ok(res, po, 'Receipt removed');
  }),

  addPayment: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.addPayment(req.params.id, req.body, req.user._id);
    created(res, po, 'Payment recorded');
  }),

  removePayment: asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.removePayment(req.params.id, req.params.subId);
    ok(res, po, 'Payment removed');
  }),

  remove: asyncHandler(async (req, res) => {
    await purchaseOrderService.remove(req.params.id);
    ok(res, null, 'Purchase order deleted');
  }),

  stats: asyncHandler(async (req, res) => {
    const data = await purchaseOrderService.stats(req.query);
    ok(res, data, 'PO statistics');
  }),
};
