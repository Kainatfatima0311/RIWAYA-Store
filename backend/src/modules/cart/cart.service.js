import { Cart } from './cart.model.js';
import { Product } from '../product/product.model.js';
import { StockItem } from '../stock/stock-item.model.js';
import { customerService } from '../customer/customer.service.js';
import { ApiError } from '../../utils/ApiError.js';

const resolveVariant = async (productId, variantId) => {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (product.status !== 'published' || !product.displayOnFrontend) {
    throw ApiError.badRequest('Product is not available');
  }
  const variant = product.variants.id(variantId);
  if (!variant) throw ApiError.notFound('Variant not found on product');

  const unitPrice = +(
    (product.salePrice > 0 && product.salePrice < product.basePrice ? product.salePrice : product.basePrice) +
    (variant.additionalPrice || 0)
  ).toFixed(2);

  return { product, variant, unitPrice };
};

const ensureCart = async (userId) => {
  const customer = await customerService.getByUserId(userId);
  if (!customer) throw ApiError.notFound('Customer profile not found');

  let cart = await Cart.findOne({ customer: customer._id });
  if (!cart) cart = await Cart.create({ customer: customer._id, items: [] });
  return { customer, cart };
};

const populateCart = (cart) =>
  cart.populate([
    {
      path: 'items.product',
      select: 'name slug basePrice salePrice currency images variants displayOnFrontend status',
    },
  ]);

export const cartService = {
  async getMine(userId) {
    const { cart } = await ensureCart(userId);
    await populateCart(cart);
    return cart;
  },

  async addItem(userId, payload) {
    const { cart } = await ensureCart(userId);
    const { variant, unitPrice } = await resolveVariant(payload.product, payload.variantId);

    // Check stock availability
    const stockItem = await StockItem.findById(variant.stockItem);
    const available = stockItem ? stockItem.totalQuantity - stockItem.reservedQuantity : 0;

    // Existing line?
    const existing = cart.items.find(
      (it) => String(it.product) === String(payload.product) && String(it.variantId) === String(payload.variantId)
    );
    const desiredQty = (existing?.quantity || 0) + payload.quantity;
    if (desiredQty > available) {
      throw ApiError.badRequest(`Only ${available} units available in stock`);
    }

    if (existing) {
      existing.quantity = desiredQty;
      existing.priceSnapshot = unitPrice;
    } else {
      cart.items.push({
        product: payload.product,
        variantId: payload.variantId,
        quantity: payload.quantity,
        priceSnapshot: unitPrice,
        addedAt: new Date(),
      });
    }
    await cart.save();
    await populateCart(cart);
    return cart;
  },

  async updateItem(userId, itemId, quantity) {
    const { cart } = await ensureCart(userId);
    const item = cart.items.id(itemId);
    if (!item) throw ApiError.notFound('Cart item not found');

    // Re-check stock
    const product = await Product.findById(item.product);
    const variant = product?.variants.id(item.variantId);
    if (variant) {
      const stockItem = await StockItem.findById(variant.stockItem);
      const available = stockItem ? stockItem.totalQuantity - stockItem.reservedQuantity : 0;
      if (quantity > available) {
        throw ApiError.badRequest(`Only ${available} units available in stock`);
      }
    }

    item.quantity = quantity;
    await cart.save();
    await populateCart(cart);
    return cart;
  },

  async removeItem(userId, itemId) {
    const { cart } = await ensureCart(userId);
    const item = cart.items.id(itemId);
    if (!item) throw ApiError.notFound('Cart item not found');
    item.deleteOne();
    await cart.save();
    await populateCart(cart);
    return cart;
  },

  async clear(userId) {
    const { cart } = await ensureCart(userId);
    cart.items = [];
    cart.couponCode = undefined;
    await cart.save();
    return cart;
  },

  async applyCoupon(userId, couponCode) {
    const { cart } = await ensureCart(userId);
    cart.couponCode = couponCode;
    await cart.save();
    await populateCart(cart);
    return cart;
  },

  async removeCoupon(userId) {
    const { cart } = await ensureCart(userId);
    cart.couponCode = undefined;
    await cart.save();
    await populateCart(cart);
    return cart;
  },
};
