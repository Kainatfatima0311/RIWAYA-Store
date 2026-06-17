import { RackCategory } from './rack-category.model.js';
import { Rack } from './rack.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

export const rackCategoryService = {
  async create(payload, userId) {
    const exists = await RackCategory.findOne({ name: payload.name });
    if (exists) throw ApiError.conflict('Category with this name already exists');
    return RackCategory.create({ ...payload, createdBy: userId });
  },

  async list({ isActive, search, sort = 'name' }) {
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = new RegExp(escapeRegex(search), 'i');
    return RackCategory.find(filter).sort(sort);
  },

  async getById(id) {
    const cat = await RackCategory.findById(id);
    if (!cat) throw ApiError.notFound('Rack category not found');
    return cat;
  },

  async update(id, payload, userId) {
    const cat = await RackCategory.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!cat) throw ApiError.notFound('Rack category not found');
    return cat;
  },

  async remove(id) {
    const inUse = await Rack.countDocuments({ rackCategory: id });
    if (inUse) {
      throw ApiError.conflict(
        `Cannot delete: category is used by ${inUse} rack(s). Reassign or deactivate instead.`
      );
    }
    const cat = await RackCategory.findByIdAndDelete(id);
    if (!cat) throw ApiError.notFound('Rack category not found');
    return cat;
  },
};
