import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { warehouseService } from './warehouse.service.js';

export const warehouseController = {
  create: asyncHandler(async (req, res) => {
    const wh = await warehouseService.create(req.body, req.user._id);
    created(res, wh, 'Warehouse created');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await warehouseService.list(req.query);
    paginated(res, items, page, limit, total, 'Warehouses fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const wh = await warehouseService.getById(req.params.id);
    ok(res, wh, 'Warehouse fetched');
  }),

  summary: asyncHandler(async (req, res) => {
    const data = await warehouseService.getSummary(req.params.id);
    ok(res, data, 'Warehouse summary fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const wh = await warehouseService.update(req.params.id, req.body, req.user._id);
    ok(res, wh, 'Warehouse updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await warehouseService.remove(req.params.id);
    ok(res, null, 'Warehouse deleted');
  }),
};
