import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { stockItemService } from './stock-item.service.js';

export const stockItemController = {
  create: asyncHandler(async (req, res) => {
    const item = await stockItemService.create(req.body, req.user._id);
    created(res, item, 'Stock item created');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await stockItemService.list(req.query);
    paginated(res, items, page, limit, total, 'Stock items fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const item = await stockItemService.getById(req.params.id);
    ok(res, item, 'Stock item fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const item = await stockItemService.update(req.params.id, req.body, req.user._id);
    ok(res, item, 'Stock item updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await stockItemService.remove(req.params.id);
    ok(res, null, 'Stock item deleted');
  }),

  // Low stock summary
  lowStock: asyncHandler(async (req, res) => {
    const data = await stockItemService.getLowStock(req.query);
    ok(res, data, 'Low stock items fetched');
  }),

  // Operations
  receive: asyncHandler(async (req, res) => {
    const result = await stockItemService.receive(req.params.id, req.body, req.user._id);
    created(res, result, 'Stock received');
  }),

  transfer: asyncHandler(async (req, res) => {
    const result = await stockItemService.transfer(req.params.id, req.body, req.user._id);
    ok(res, result, 'Stock transferred');
  }),

  adjust: asyncHandler(async (req, res) => {
    const result = await stockItemService.adjust(req.params.id, req.body, req.user._id);
    ok(res, result, 'Stock adjusted');
  }),

  writeOff: asyncHandler(async (req, res) => {
    const result = await stockItemService.writeOff(req.params.id, req.body, req.user._id);
    ok(res, result, 'Stock written off');
  }),

  // Drill-downs
  entries: asyncHandler(async (req, res) => {
    const items = await stockItemService.entriesByItem(req.params.id);
    ok(res, items, 'Per-rack distribution fetched');
  }),

  movements: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await stockItemService.movementsForItem(
      req.params.id,
      req.query
    );
    paginated(res, items, page, limit, total, 'Item movements fetched');
  }),
};
