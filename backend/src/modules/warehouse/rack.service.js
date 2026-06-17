import { Rack } from './rack.model.js';
import { Floor } from './floor.model.js';
import { Warehouse } from './warehouse.model.js';
import { RackCategory } from './rack-category.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { warehouseService } from './warehouse.service.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

export const rackService = {
  async create(payload, userId) {
    // Validate references
    const [wh, floor, cat] = await Promise.all([
      Warehouse.findById(payload.warehouse),
      Floor.findById(payload.floor),
      RackCategory.findById(payload.rackCategory),
    ]);
    if (!wh) throw ApiError.notFound('Warehouse not found');
    if (!floor) throw ApiError.notFound('Floor not found');
    if (!cat) throw ApiError.notFound('Rack category not found');
    if (String(floor.warehouse) !== String(payload.warehouse)) {
      throw ApiError.badRequest('Floor does not belong to the specified warehouse');
    }

    // Unique code per warehouse
    const dup = await Rack.findOne({
      warehouse: payload.warehouse,
      code: payload.code.toUpperCase(),
    });
    if (dup) throw ApiError.conflict(`Rack code '${payload.code}' already exists in this warehouse`);

    const rack = await Rack.create({ ...payload, createdBy: userId });

    // Update counters
    await Promise.all([
      warehouseService.recalcCounts(payload.warehouse),
      Floor.findByIdAndUpdate(payload.floor, { $inc: { totalRacks: 1 } }),
    ]);

    return rack;
  },

  async list({
    warehouse,
    floor,
    rackCategory,
    type,
    isActive,
    search,
    page = 1,
    limit = 50,
    sort = 'code',
  }) {
    const filter = {};
    if (warehouse) filter.warehouse = warehouse;
    if (floor) filter.floor = floor;
    if (rackCategory) filter.rackCategory = rackCategory;
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [{ code: new RegExp(escapeRegex(search), 'i') }, { name: new RegExp(escapeRegex(search), 'i') }];
    }

    const [items, total] = await Promise.all([
      Rack.find(filter)
        .populate('warehouse', 'name code')
        .populate('floor', 'floorNumber name')
        .populate('rackCategory', 'name color')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Rack.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },

  async getById(id) {
    const rack = await Rack.findById(id)
      .populate('warehouse', 'name code location')
      .populate('floor', 'floorNumber name')
      .populate('rackCategory', 'name color');
    if (!rack) throw ApiError.notFound('Rack not found');
    return rack;
  },

  async update(id, payload, userId) {
    if (payload.code) payload.code = payload.code.toUpperCase();

    if (payload.floor || payload.rackCategory) {
      const rack = await Rack.findById(id);
      if (!rack) throw ApiError.notFound('Rack not found');
      if (payload.floor) {
        const floor = await Floor.findById(payload.floor);
        if (!floor) throw ApiError.notFound('Floor not found');
        if (String(floor.warehouse) !== String(rack.warehouse)) {
          throw ApiError.badRequest('Floor does not belong to this warehouse');
        }
      }
      if (payload.rackCategory) {
        const cat = await RackCategory.findById(payload.rackCategory);
        if (!cat) throw ApiError.notFound('Rack category not found');
      }
    }

    const rack = await Rack.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!rack) throw ApiError.notFound('Rack not found');
    return rack;
  },

  async remove(id) {
    const rack = await Rack.findById(id);
    if (!rack) throw ApiError.notFound('Rack not found');

    if (rack.currentOccupancy > 0) {
      throw ApiError.conflict(
        `Cannot delete: rack contains ${rack.currentOccupancy} unit(s). Move stock first.`
      );
    }

    await rack.deleteOne();
    await Promise.all([
      warehouseService.recalcCounts(rack.warehouse),
      Floor.findByIdAndUpdate(rack.floor, { $inc: { totalRacks: -1 } }),
    ]);
    return rack;
  },
};
