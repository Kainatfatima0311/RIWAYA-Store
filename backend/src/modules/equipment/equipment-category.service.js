import { EquipmentCategory } from './equipment-category.model.js';
import { Equipment } from './equipment.model.js';
import { ApiError } from '../../utils/ApiError.js';

export const equipmentCategoryService = {
  async create(payload, userId) {
    const exists = await EquipmentCategory.findOne({ name: payload.name });
    if (exists) throw ApiError.conflict('Equipment category with this name already exists');
    return EquipmentCategory.create({ ...payload, createdBy: userId });
  },

  async list({ isActive, search, sort = 'name' }) {
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = new RegExp(search, 'i');
    return EquipmentCategory.find(filter).sort(sort);
  },

  async getById(id) {
    const cat = await EquipmentCategory.findById(id);
    if (!cat) throw ApiError.notFound('Equipment category not found');
    return cat;
  },

  async update(id, payload, userId) {
    const cat = await EquipmentCategory.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!cat) throw ApiError.notFound('Equipment category not found');
    return cat;
  },

  async remove(id) {
    const inUse = await Equipment.countDocuments({ category: id });
    if (inUse) {
      throw ApiError.conflict(
        `Cannot delete: category is used by ${inUse} equipment item(s). Reassign or deactivate instead.`
      );
    }
    const cat = await EquipmentCategory.findByIdAndDelete(id);
    if (!cat) throw ApiError.notFound('Equipment category not found');
    return cat;
  },
};
