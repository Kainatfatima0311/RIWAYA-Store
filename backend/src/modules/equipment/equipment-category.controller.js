import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { equipmentCategoryService } from './equipment-category.service.js';

export const equipmentCategoryController = {
  create: asyncHandler(async (req, res) => {
    const cat = await equipmentCategoryService.create(req.body, req.user._id);
    created(res, cat, 'Equipment category created');
  }),

  list: asyncHandler(async (req, res) => {
    const items = await equipmentCategoryService.list(req.query);
    ok(res, items, 'Equipment categories fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const cat = await equipmentCategoryService.getById(req.params.id);
    ok(res, cat, 'Equipment category fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const cat = await equipmentCategoryService.update(req.params.id, req.body, req.user._id);
    ok(res, cat, 'Equipment category updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await equipmentCategoryService.remove(req.params.id);
    ok(res, null, 'Equipment category deleted');
  }),
};
