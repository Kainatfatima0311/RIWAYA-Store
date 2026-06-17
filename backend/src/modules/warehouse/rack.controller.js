import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { rackService } from './rack.service.js';

export const rackController = {
  create: asyncHandler(async (req, res) => {
    const rack = await rackService.create(req.body, req.user._id);
    created(res, rack, 'Rack created');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await rackService.list(req.query);
    paginated(res, items, page, limit, total, 'Racks fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const rack = await rackService.getById(req.params.id);
    ok(res, rack, 'Rack fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const rack = await rackService.update(req.params.id, req.body, req.user._id);
    ok(res, rack, 'Rack updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await rackService.remove(req.params.id);
    ok(res, null, 'Rack deleted');
  }),
};
