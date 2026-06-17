import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { cartService } from './cart.service.js';

export const cartController = {
  getMine: asyncHandler(async (req, res) => {
    const cart = await cartService.getMine(req.user._id);
    ok(res, cart, 'Cart fetched');
  }),

  addItem: asyncHandler(async (req, res) => {
    const cart = await cartService.addItem(req.user._id, req.body);
    created(res, cart, 'Item added to cart');
  }),

  updateItem: asyncHandler(async (req, res) => {
    const cart = await cartService.updateItem(req.user._id, req.params.itemId, req.body.quantity);
    ok(res, cart, 'Cart item updated');
  }),

  removeItem: asyncHandler(async (req, res) => {
    const cart = await cartService.removeItem(req.user._id, req.params.itemId);
    ok(res, cart, 'Item removed from cart');
  }),

  clear: asyncHandler(async (req, res) => {
    await cartService.clear(req.user._id);
    ok(res, null, 'Cart cleared');
  }),

  applyCoupon: asyncHandler(async (req, res) => {
    const cart = await cartService.applyCoupon(req.user._id, req.body.couponCode);
    ok(res, cart, 'Coupon applied');
  }),

  removeCoupon: asyncHandler(async (req, res) => {
    const cart = await cartService.removeCoupon(req.user._id);
    ok(res, cart, 'Coupon removed');
  }),
};
