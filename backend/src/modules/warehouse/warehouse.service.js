import { Warehouse } from './warehouse.model.js';
import { Floor } from './floor.model.js';
import { Rack } from './rack.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

export const warehouseService = {
  async create(payload, userId) {
    const exists = await Warehouse.findOne({
      $or: [{ name: payload.name }, { code: payload.code.toUpperCase() }],
    });
    if (exists) {
      const dup = exists.name === payload.name ? 'name' : 'code';
      throw ApiError.conflict(`Warehouse ${dup} already exists`);
    }
    return Warehouse.create({ ...payload, createdBy: userId });
  },

  async list({ page = 1, limit = 20, search, isActive, city, sort = '-createdAt' }) {
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (city) filter['location.city'] = new RegExp(escapeRegex(city), 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(escapeRegex(search), 'i') },
        { code: new RegExp(escapeRegex(search), 'i') },
        { 'location.city': new RegExp(escapeRegex(search), 'i') },
      ];
    }
    const [items, total] = await Promise.all([
      Warehouse.find(filter)
        .populate('manager', 'name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Warehouse.countDocuments(filter),
    ]);
    return { items, page, limit, total };
  },

  async getById(id) {
    const wh = await Warehouse.findById(id)
      .populate('manager', 'name email phone')
      .populate('createdBy', 'name email');
    if (!wh) throw ApiError.notFound('Warehouse not found');
    return wh;
  },

  async getSummary(id) {
    const wh = await warehouseService.getById(id);
    const [floorCount, rackCount] = await Promise.all([
      Floor.countDocuments({ warehouse: id }),
      Rack.countDocuments({ warehouse: id }),
    ]);
    return {
      warehouse: wh,
      counts: { floors: floorCount, racks: rackCount },
    };
  },

  async update(id, payload, userId) {
    if (payload.code) payload.code = payload.code.toUpperCase();
    const wh = await Warehouse.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!wh) throw ApiError.notFound('Warehouse not found');
    return wh;
  },

  async remove(id) {
    const [floorCount, rackCount] = await Promise.all([
      Floor.countDocuments({ warehouse: id }),
      Rack.countDocuments({ warehouse: id }),
    ]);
    if (floorCount || rackCount) {
      throw ApiError.conflict(
        `Cannot delete: warehouse has ${floorCount} floor(s) and ${rackCount} rack(s). Remove them first or deactivate the warehouse.`
      );
    }
    const wh = await Warehouse.findByIdAndDelete(id);
    if (!wh) throw ApiError.notFound('Warehouse not found');
    return wh;
  },

  // Internal helpers used by Floor/Rack services
  async recalcCounts(warehouseId) {
    const [floors, racks] = await Promise.all([
      Floor.countDocuments({ warehouse: warehouseId }),
      Rack.countDocuments({ warehouse: warehouseId }),
    ]);
    await Warehouse.findByIdAndUpdate(warehouseId, {
      totalFloors: floors,
      totalRacks: racks,
    });
  },
};
