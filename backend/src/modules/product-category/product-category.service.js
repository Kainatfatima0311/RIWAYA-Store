import { ProductCategory } from './product-category.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

// Helper: rebuild path + depth from parent
const computePathAndDepth = async (parentId) => {
  if (!parentId) return { path: '/', depth: 0 };
  const parent = await ProductCategory.findById(parentId);
  if (!parent) throw ApiError.notFound('Parent category not found');
  return {
    path: `${parent.path}${parent.slug}/`,
    depth: parent.depth + 1,
  };
};

// Helper: when a parent is renamed/moved, descendants need their paths refreshed
const refreshDescendantPaths = async (rootId) => {
  const root = await ProductCategory.findById(rootId);
  if (!root) return;
  const descendants = await ProductCategory.find({ path: new RegExp(`^${root.path}${root.slug}/`) });
  for (const child of descendants) {
    const parent = await ProductCategory.findById(child.parent);
    if (parent) {
      child.path = `${parent.path}${parent.slug}/`;
      child.depth = parent.depth + 1;
      await child.save();
    }
  }
};

export const productCategoryService = {
  async create(payload, userId) {
    const { path, depth } = await computePathAndDepth(payload.parent || null);
    return ProductCategory.create({
      ...payload,
      path,
      depth,
      createdBy: userId,
    });
  },

  async list({ search, parent, displayOnFrontend, isActive, isFeatured, sort = 'displayOrder name' }) {
    const filter = {};
    if (parent === 'root') filter.parent = null;
    else if (parent) filter.parent = parent;
    if (displayOnFrontend !== undefined) filter.displayOnFrontend = displayOnFrontend === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (search) filter.name = new RegExp(escapeRegex(search), 'i');

    return ProductCategory.find(filter).populate('parent', 'name slug').sort(sort);
  },

  async tree({ onlyFrontend = false } = {}) {
    const filter = { isActive: true };
    if (onlyFrontend) filter.displayOnFrontend = true;
    const all = await ProductCategory.find(filter).sort('displayOrder name').lean();
    const byId = new Map(all.map((c) => [String(c._id), { ...c, children: [] }]));
    const roots = [];
    for (const c of byId.values()) {
      if (c.parent && byId.has(String(c.parent))) {
        byId.get(String(c.parent)).children.push(c);
      } else {
        roots.push(c);
      }
    }
    return roots;
  },

  async getById(id) {
    const cat = await ProductCategory.findById(id).populate('parent', 'name slug path');
    if (!cat) throw ApiError.notFound('Category not found');
    return cat;
  },

  async getBySlug(slug) {
    const cat = await ProductCategory.findOne({ slug }).populate('parent', 'name slug path');
    if (!cat) throw ApiError.notFound('Category not found');
    return cat;
  },

  async getBreadcrumb(id) {
    const cat = await ProductCategory.findById(id);
    if (!cat) throw ApiError.notFound('Category not found');

    const slugs = cat.path.split('/').filter(Boolean);
    const ancestors = await ProductCategory.find({ slug: { $in: slugs } })
      .select('name slug')
      .lean();
    const bySlug = new Map(ancestors.map((a) => [a.slug, a]));
    const chain = slugs.map((s) => bySlug.get(s)).filter(Boolean);
    chain.push({ _id: cat._id, name: cat.name, slug: cat.slug });
    return chain;
  },

  async update(id, payload, userId) {
    const existing = await ProductCategory.findById(id);
    if (!existing) throw ApiError.notFound('Category not found');

    const parentChanged =
      payload.parent !== undefined && String(payload.parent ?? '') !== String(existing.parent ?? '');

    if (parentChanged) {
      // Prevent making a category a descendant of itself
      if (payload.parent && String(payload.parent) === String(id)) {
        throw ApiError.badRequest('A category cannot be its own parent');
      }
      if (payload.parent) {
        const newParent = await ProductCategory.findById(payload.parent);
        if (!newParent) throw ApiError.notFound('Parent category not found');
        const subtreePrefix = `${existing.path}${existing.slug}/`;
        if (
          String(newParent._id) === String(id) ||
          newParent.path === subtreePrefix ||
          newParent.path.startsWith(subtreePrefix)
        ) {
          throw ApiError.badRequest('A category cannot be moved under one of its own descendants');
        }
      }
      const { path, depth } = await computePathAndDepth(payload.parent || null);
      payload.path = path;
      payload.depth = depth;
    }

    const slugBefore = existing.slug;
    Object.assign(existing, { ...payload, updatedBy: userId });
    await existing.save();

    if (parentChanged || existing.slug !== slugBefore) {
      await refreshDescendantPaths(id);
    }

    return existing;
  },

  async remove(id) {
    const childCount = await ProductCategory.countDocuments({ parent: id });
    if (childCount) {
      throw ApiError.conflict(`Cannot delete: category has ${childCount} sub-categories. Remove them first.`);
    }
    const { Product } = await import('../product/product.model.js');
    const productCount = await Product.countDocuments({ categories: id });
    if (productCount) {
      throw ApiError.conflict(
        `Cannot delete: ${productCount} product(s) are linked. Reassign or deactivate instead.`
      );
    }
    const cat = await ProductCategory.findByIdAndDelete(id);
    if (!cat) throw ApiError.notFound('Category not found');
    return cat;
  },

  // Internal: refresh productCount denormalized field
  async refreshProductCount(categoryId) {
    const { Product } = await import('../product/product.model.js');
    const count = await Product.countDocuments({ categories: categoryId, status: 'published' });
    await ProductCategory.findByIdAndUpdate(categoryId, { productCount: count });
  },
};
