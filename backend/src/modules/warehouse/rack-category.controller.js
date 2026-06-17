import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { rackCategoryService } from './rack-category.service.js';

export const rackCategoryController = {
  create: asyncHandler(async (req, res) => {
    const cat = await rackCategoryService.create(req.body, req.user._id);
    created(res, cat, 'Rack category created');
  }),

  list: asyncHandler(async (req, res) => {
    const items = await rackCategoryService.list(req.query);
    ok(res, items, 'Rack categories fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const cat = await rackCategoryService.getById(req.params.id);
    ok(res, cat, 'Rack category fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const cat = await rackCategoryService.update(req.params.id, req.body, req.user._id);
    ok(res, cat, 'Rack category updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await rackCategoryService.remove(req.params.id);
    ok(res, null, 'Rack category deleted');
  }),
};
