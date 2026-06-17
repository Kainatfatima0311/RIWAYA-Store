import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { supplierService } from './supplier.service.js';

export const supplierController = {
  create: asyncHandler(async (req, res) => {
    const sup = await supplierService.create(req.body, req.user._id);
    created(res, sup, 'Supplier created');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await supplierService.list(req.query);
    paginated(res, items, page, limit, total, 'Suppliers fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const sup = await supplierService.getById(req.params.id);
    ok(res, sup, 'Supplier fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const sup = await supplierService.update(req.params.id, req.body, req.user._id);
    ok(res, sup, 'Supplier updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await supplierService.remove(req.params.id);
    ok(res, null, 'Supplier deleted');
  }),
};
