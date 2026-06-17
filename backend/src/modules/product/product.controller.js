import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, paginated } from '../../utils/ApiResponse.js';
import { productService } from './product.service.js';

export const productController = {
  // ===== Admin =====
  create: asyncHandler(async (req, res) => {
    const p = await productService.create(req.body, req.user._id);
    created(res, p, 'Product created');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await productService.list(req.query);
    paginated(res, items, page, limit, total, 'Products fetched');
  }),

  getOne: asyncHandler(async (req, res) => {
    const p = await productService.getById(req.params.id);
    ok(res, p, 'Product fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const p = await productService.update(req.params.id, req.body, req.user._id);
    ok(res, p, 'Product updated');
  }),

  setDisplay: asyncHandler(async (req, res) => {
    const p = await productService.setDisplay(req.params.id, req.body.displayOnFrontend, req.user._id);
    ok(res, p, `Product ${p.displayOnFrontend ? 'shown on' : 'hidden from'} storefront`);
  }),

  setStatus: asyncHandler(async (req, res) => {
    const p = await productService.setStatus(req.params.id, req.body.status, req.user._id);
    ok(res, p, `Product status updated to '${p.status}'`);
  }),

  remove: asyncHandler(async (req, res) => {
    await productService.remove(req.params.id);
    ok(res, null, 'Product deleted');
  }),

  // ===== Public storefront =====
  storefrontList: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await productService.listStorefront(req.query);
    paginated(res, items, page, limit, total, 'Products fetched');
  }),

  storefrontGet: asyncHandler(async (req, res) => {
    const p = await productService.getBySlug(req.params.slug, { incrementView: true });
    ok(res, p, 'Product fetched');
  }),

  storefrontFeatured: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 8, 24);
    const items = await productService.listFeaturedStorefront(limit);
    ok(res, items, 'Featured products fetched');
  }),
};
