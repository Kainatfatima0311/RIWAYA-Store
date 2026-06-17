import { Floor } from './floor.model.js';
import { Warehouse } from './warehouse.model.js';
import { Rack } from './rack.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { warehouseService } from './warehouse.service.js';

export const floorService = {
  async create(payload, userId) {
    const wh = await Warehouse.findById(payload.warehouse);
    if (!wh) throw ApiError.notFound('Warehouse not found');

    const dup = await Floor.findOne({
      warehouse: payload.warehouse,
      floorNumber: payload.floorNumber,
    });
    if (dup) {
      throw ApiError.conflict(`Floor #${payload.floorNumber} already exists in this warehouse`);
    }

    const floor = await Floor.create({ ...payload, createdBy: userId });
    await warehouseService.recalcCounts(payload.warehouse);
    return floor;
  },

  async list({ warehouse, isActive, sort = 'floorNumber' }) {
    const filter = {};
    if (warehouse) filter.warehouse = warehouse;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    return Floor.find(filter).populate('warehouse', 'name code').sort(sort);
  },

  async getById(id) {
    const floor = await Floor.findById(id).populate('warehouse', 'name code location');
    if (!floor) throw ApiError.notFound('Floor not found');
    return floor;
  },

  async update(id, payload, userId) {
    const floor = await Floor.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!floor) throw ApiError.notFound('Floor not found');
    return floor;
  },

  async remove(id) {
    const rackCount = await Rack.countDocuments({ floor: id });
    if (rackCount) {
      throw ApiError.conflict(
        `Cannot delete: floor has ${rackCount} rack(s). Remove them first.`
      );
    }
    const floor = await Floor.findByIdAndDelete(id);
    if (!floor) throw ApiError.notFound('Floor not found');
    await warehouseService.recalcCounts(floor.warehouse);
    return floor;
  },
};
