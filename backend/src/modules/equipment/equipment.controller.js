import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { equipmentService } from './equipment.service.js';

export const equipmentController = {
  create: asyncHandler(async (req, res) => {
    const eq = await equipmentService.create(req.body, req.user._id);
    created(res, eq, 'Equipment recorded');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await equipmentService.list(req.query);
    paginated(res, items, page, limit, total, 'Equipment fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const eq = await equipmentService.getById(req.params.id);
    ok(res, eq, 'Equipment fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const eq = await equipmentService.update(req.params.id, req.body, req.user._id);
    ok(res, eq, 'Equipment updated');
  }),

  assign: asyncHandler(async (req, res) => {
    const eq = await equipmentService.assign(req.params.id, req.body.assignedTo, req.user._id);
    ok(res, eq, 'Equipment assignment updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await equipmentService.remove(req.params.id);
    ok(res, null, 'Equipment deleted');
  }),

  spendSummary: asyncHandler(async (req, res) => {
    const data = await equipmentService.spendSummary(req.query);
    ok(res, data, 'Equipment spend summary');
  }),
};
