import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { wishlistService } from './wishlist.service.js';

export const wishlistController = {
  getMine: asyncHandler(async (req, res) => {
    const wl = await wishlistService.getMine(req.user._id);
    ok(res, wl, 'Wishlist fetched');
  }),

  addItem: asyncHandler(async (req, res) => {
    const wl = await wishlistService.addItem(req.user._id, req.body);
    created(res, wl, 'Added to wishlist');
  }),

  removeItem: asyncHandler(async (req, res) => {
    const wl = await wishlistService.removeItem(req.user._id, req.params.itemId);
    ok(res, wl, 'Removed from wishlist');
  }),

  removeByProduct: asyncHandler(async (req, res) => {
    const wl = await wishlistService.removeByProduct(req.user._id, req.params.productId);
    ok(res, wl, 'Removed from wishlist');
  }),

  clear: asyncHandler(async (req, res) => {
    await wishlistService.clear(req.user._id);
    ok(res, null, 'Wishlist cleared');
  }),

  check: asyncHandler(async (req, res) => {
    const inList = await wishlistService.checkProduct(req.user._id, req.params.productId);
    ok(res, { inWishlist: inList }, 'Wishlist check');
  }),
};
