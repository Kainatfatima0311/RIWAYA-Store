import { Product } from './product.model.js';
import { ProductCategory } from '../product-category/product-category.model.js';
import { StockItem } from '../stock/stock-item.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { productCategoryService } from '../product-category/product-category.service.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

const validateCategoriesAndVariants = async ({ categories, variants }) => {
  if (categories?.length) {
    const found = await ProductCategory.countDocuments({ _id: { $in: categories } });
    if (found !== categories.length) throw ApiError.badRequest('One or more categories not found');
  }
  if (variants?.length) {
    const stockIds = variants.map((v) => v.stockItem);
    const found = await StockItem.countDocuments({ _id: { $in: stockIds } });
    if (found !== stockIds.length) {
      throw ApiError.badRequest('One or more variant stock items not found');
    }
  }
};

export const productService = {
  async create(payload, userId) {
    await validateCategoriesAndVariants(payload);
    const product = await Product.create({ ...payload, createdBy: userId });
    // Refresh category counts for affected categories
    if (payload.status === 'published') {
      await Promise.all(payload.categories.map((c) => productCategoryService.refreshProductCount(c)));
    }
    return product;
  },

  async list({
    page = 1,
    limit = 20,
    search,
    category,
    status,
    displayOnFrontend,
    isFeatured,
    minPrice,
    maxPrice,
    sort = '-updatedAt',
  }) {
    const filter = {};
    if (category) filter.categories = category;
    if (status) filter.status = status;
    if (displayOnFrontend !== undefined) filter.displayOnFrontend = displayOnFrontend === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (minPrice != null || maxPrice != null) {
      filter.basePrice = {};
      if (minPrice != null) filter.basePrice.$gte = minPrice;
      if (maxPrice != null) filter.basePrice.$lte = maxPrice;
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(escapeRegex(search), 'i') },
        { sku: new RegExp(escapeRegex(search), 'i') },
        { brand: new RegExp(escapeRegex(search), 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate('categories', 'name slug')
        .populate('variants.stockItem', 'name sku totalQuantity availableQuantity stockStatus')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },

  async getById(id) {
    const product = await Product.findById(id)
      .populate('categories', 'name slug path')
      .populate('variants.stockItem', 'name sku totalQuantity availableQuantity stockStatus unitCost')
      .populate('createdBy', 'name email');
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  },

  async getBySlug(slug, { incrementView = false } = {}) {
    const product = await Product.findOne({ slug })
      .populate('categories', 'name slug path')
      .populate('variants.stockItem', 'name sku totalQuantity reservedQuantity availableQuantity stockStatus');
    if (!product) throw ApiError.notFound('Product not found');
    if (incrementView) {
      Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec().catch(() => {});
    }
    return product;
  },

  async update(id, payload, userId) {
    await validateCategoriesAndVariants(payload);

    const existing = await Product.findById(id);
    if (!existing) throw ApiError.notFound('Product not found');

    const oldCategories = existing.categories.map(String);
    Object.assign(existing, { ...payload, updatedBy: userId });
    await existing.save();

    const newCategories = existing.categories.map(String);
    const affected = new Set([...oldCategories, ...newCategories]);
    await Promise.all([...affected].map((c) => productCategoryService.refreshProductCount(c)));

    return existing;
  },

  async setDisplay(id, displayOnFrontend, userId) {
    const p = await Product.findByIdAndUpdate(
      id,
      { displayOnFrontend, updatedBy: userId },
      { new: true }
    );
    if (!p) throw ApiError.notFound('Product not found');
    return p;
  },

  async setStatus(id, status, userId) {
    const p = await Product.findById(id);
    if (!p) throw ApiError.notFound('Product not found');
    p.status = status;
    p.updatedBy = userId;
    await p.save();
    await Promise.all(p.categories.map((c) => productCategoryService.refreshProductCount(c)));
    return p;
  },

  async remove(id) {
    const p = await Product.findByIdAndDelete(id);
    if (!p) throw ApiError.notFound('Product not found');
    await Promise.all(p.categories.map((c) => productCategoryService.refreshProductCount(c)));
    return p;
  },

  // ===== Public storefront =====
  async listStorefront({
    page = 1,
    limit = 20,
    search,
    category,
    isFeatured,
    minPrice,
    maxPrice,
    sort = '-publishedAt',
  }) {
    const filter = { status: 'published', displayOnFrontend: true };
    if (category) filter.categories = category;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (minPrice != null || maxPrice != null) {
      filter.basePrice = {};
      if (minPrice != null) filter.basePrice.$gte = minPrice;
      if (maxPrice != null) filter.basePrice.$lte = maxPrice;
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(escapeRegex(search), 'i') },
        { tags: new RegExp(escapeRegex(search), 'i') },
        { brand: new RegExp(escapeRegex(search), 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .select(
          'name slug shortDescription basePrice salePrice currency images brand averageRating reviewCount totalSold isFeatured isNew isBestseller tags categories variants'
        )
        .populate('categories', 'name slug')
        .populate('variants.stockItem', 'name sku totalQuantity reservedQuantity')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },

  async listFeaturedStorefront(limit = 8) {
    return Product.find({ status: 'published', displayOnFrontend: true, isFeatured: true })
      .select('name slug shortDescription basePrice salePrice currency images averageRating brand categories variants')
      .populate('categories', 'name slug')
      .populate('variants.stockItem', 'name sku totalQuantity reservedQuantity')
      .sort('-publishedAt')
      .limit(limit);
  },
};
