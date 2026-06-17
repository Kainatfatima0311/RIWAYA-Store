import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { productCategoryService } from './product-category.service.js';

export const productCategoryController = {
  create: asyncHandler(async (req, res) => {
    const cat = await productCategoryService.create(req.body, req.user._id);
    created(res, cat, 'Category created');
  }),

  list: asyncHandler(async (req, res) => {
    const items = await productCategoryService.list(req.query);
    ok(res, items, 'Categories fetched');
  }),

  tree: asyncHandler(async (req, res) => {
    const data = await productCategoryService.tree({
      onlyFrontend: req.query.onlyFrontend === 'true',
    });
    ok(res, data, 'Category tree fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const cat = await productCategoryService.getById(req.params.id);
    ok(res, cat, 'Category fetched');
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const cat = await productCategoryService.getBySlug(req.params.slug);
    ok(res, cat, 'Category fetched');
  }),

  breadcrumb: asyncHandler(async (req, res) => {
    const chain = await productCategoryService.getBreadcrumb(req.params.id);
    ok(res, chain, 'Breadcrumb fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const cat = await productCategoryService.update(req.params.id, req.body, req.user._id);
    ok(res, cat, 'Category updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await productCategoryService.remove(req.params.id);
    ok(res, null, 'Category deleted');
  }),
};
