import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { floorService } from './floor.service.js';

export const floorController = {
  create: asyncHandler(async (req, res) => {
    const floor = await floorService.create(req.body, req.user._id);
    created(res, floor, 'Floor created');
  }),

  list: asyncHandler(async (req, res) => {
    const items = await floorService.list(req.query);
    ok(res, items, 'Floors fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const floor = await floorService.getById(req.params.id);
    ok(res, floor, 'Floor fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const floor = await floorService.update(req.params.id, req.body, req.user._id);
    ok(res, floor, 'Floor updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await floorService.remove(req.params.id);
    ok(res, null, 'Floor deleted');
  }),
};
