import { Wishlist } from './wishlist.model.js';
import { Product } from '../product/product.model.js';
import { customerService } from '../customer/customer.service.js';
import { ApiError } from '../../utils/ApiError.js';

const ensureWishlist = async (userId) => {
  const customer = await customerService.getByUserId(userId);
  if (!customer) throw ApiError.notFound('Customer profile not found');
  let wl = await Wishlist.findOne({ customer: customer._id });
  if (!wl) wl = await Wishlist.create({ customer: customer._id, items: [] });
  return wl;
};

const populate = (wl) =>
  wl.populate({
    path: 'items.product',
    select: 'name slug basePrice salePrice currency images averageRating reviewCount status displayOnFrontend',
  });

export const wishlistService = {
  async getMine(userId) {
    const wl = await ensureWishlist(userId);
    await populate(wl);
    return wl;
  },

  async addItem(userId, payload) {
    const product = await Product.findById(payload.product);
    if (!product) throw ApiError.notFound('Product not found');

    const wl = await ensureWishlist(userId);
    const existing = wl.items.find((it) => String(it.product) === String(payload.product));
    if (existing) {
      if (payload.notes !== undefined) existing.notes = payload.notes;
    } else {
      wl.items.push({ product: payload.product, notes: payload.notes, addedAt: new Date() });
    }
    await wl.save();
    await populate(wl);
    return wl;
  },

  async removeItem(userId, itemId) {
    const wl = await ensureWishlist(userId);
    const item = wl.items.id(itemId);
    if (!item) throw ApiError.notFound('Wishlist item not found');
    item.deleteOne();
    await wl.save();
    await populate(wl);
    return wl;
  },

  async removeByProduct(userId, productId) {
    const wl = await ensureWishlist(userId);
    const before = wl.items.length;
    wl.items = wl.items.filter((it) => String(it.product) !== String(productId));
    if (wl.items.length === before) throw ApiError.notFound('Product not in wishlist');
    await wl.save();
    await populate(wl);
    return wl;
  },

  async clear(userId) {
    const wl = await ensureWishlist(userId);
    wl.items = [];
    await wl.save();
    return wl;
  },

  async checkProduct(userId, productId) {
    const wl = await ensureWishlist(userId);
    return wl.items.some((it) => String(it.product) === String(productId));
  },
};
