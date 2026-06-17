import { Equipment } from './equipment.model.js';
import { EquipmentCategory } from './equipment-category.model.js';
import { Warehouse } from '../warehouse/warehouse.model.js';
import { Floor } from '../warehouse/floor.model.js';
import { Rack } from '../warehouse/rack.model.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

const validateRefs = async ({ category, warehouse, floor, rack, assignedTo }) => {
  const checks = [];
  if (category) checks.push(EquipmentCategory.exists({ _id: category }).then((r) => ({ k: 'category', r })));
  if (warehouse) checks.push(Warehouse.exists({ _id: warehouse }).then((r) => ({ k: 'warehouse', r })));
  if (floor) checks.push(Floor.exists({ _id: floor }).then((r) => ({ k: 'floor', r })));
  if (rack) checks.push(Rack.exists({ _id: rack }).then((r) => ({ k: 'rack', r })));
  if (assignedTo) checks.push(User.exists({ _id: assignedTo }).then((r) => ({ k: 'assignedTo', r })));

  const results = await Promise.all(checks);
  for (const { k, r } of results) {
    if (!r) throw ApiError.notFound(`Referenced ${k} not found`);
  }
};

export const equipmentService = {
  async create(payload, userId) {
    await validateRefs(payload);

    // Optional: ensure floor belongs to warehouse, rack to floor/warehouse
    if (payload.floor && payload.warehouse) {
      const floor = await Floor.findById(payload.floor).lean();
      if (String(floor.warehouse) !== String(payload.warehouse)) {
        throw ApiError.badRequest('Floor does not belong to the specified warehouse');
      }
    }
    if (payload.rack && payload.warehouse) {
      const rack = await Rack.findById(payload.rack).lean();
      if (String(rack.warehouse) !== String(payload.warehouse)) {
        throw ApiError.badRequest('Rack does not belong to the specified warehouse');
      }
    }

    const data = { ...payload, createdBy: userId };
    if (payload.assignedTo) data.assignedAt = new Date();

    return Equipment.create(data);
  },

  async list({
    page = 1,
    limit = 20,
    search,
    category,
    warehouse,
    condition,
    status,
    assignedTo,
    minCost,
    maxCost,
    purchasedFrom,
    purchasedTo,
    sort = '-purchaseDate',
  }) {
    const filter = {};
    if (category) filter.category = category;
    if (warehouse) filter.warehouse = warehouse;
    if (condition) filter.condition = condition;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (minCost != null || maxCost != null) {
      filter.unitCost = {};
      if (minCost != null) filter.unitCost.$gte = minCost;
      if (maxCost != null) filter.unitCost.$lte = maxCost;
    }
    if (purchasedFrom || purchasedTo) {
      filter.purchaseDate = {};
      if (purchasedFrom) filter.purchaseDate.$gte = purchasedFrom;
      if (purchasedTo) filter.purchaseDate.$lte = purchasedTo;
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(escapeRegex(search), 'i') },
        { brand: new RegExp(escapeRegex(search), 'i') },
        { model: new RegExp(escapeRegex(search), 'i') },
        { serialNumber: new RegExp(escapeRegex(search), 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Equipment.find(filter)
        .populate('category', 'name color icon')
        .populate('warehouse', 'name code')
        .populate('floor', 'floorNumber name')
        .populate('rack', 'code name')
        .populate('assignedTo', 'name email role')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Equipment.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },

  async getById(id) {
    const eq = await Equipment.findById(id)
      .populate('category', 'name color icon')
      .populate('warehouse', 'name code location')
      .populate('floor', 'floorNumber name')
      .populate('rack', 'code name')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');
    if (!eq) throw ApiError.notFound('Equipment not found');
    return eq;
  },

  async update(id, payload, userId) {
    await validateRefs(payload);
    const data = { ...payload, updatedBy: userId };
    if (payload.assignedTo) data.assignedAt = new Date();

    // mongoose middleware (pre 'validate') runs on save(), not on findByIdAndUpdate
    // — so to recompute totalCost/warrantyExpiry we use save flow
    const eq = await Equipment.findById(id);
    if (!eq) throw ApiError.notFound('Equipment not found');

    Object.assign(eq, data);
    await eq.save();
    return eq;
  },

  async assign(id, assignedTo, userId) {
    if (assignedTo) {
      const u = await User.exists({ _id: assignedTo });
      if (!u) throw ApiError.notFound('User not found');
    }
    const eq = await Equipment.findByIdAndUpdate(
      id,
      {
        assignedTo: assignedTo || null,
        assignedAt: assignedTo ? new Date() : null,
        updatedBy: userId,
      },
      { new: true }
    ).populate('assignedTo', 'name email role');
    if (!eq) throw ApiError.notFound('Equipment not found');
    return eq;
  },

  async remove(id) {
    const eq = await Equipment.findByIdAndDelete(id);
    if (!eq) throw ApiError.notFound('Equipment not found');
    return eq;
  },

  // Spend summary — total spent on equipment, grouped optionally
  async spendSummary({ warehouse, category, from, to }) {
    const match = {};
    if (warehouse) match.warehouse = new (await import('mongoose')).default.Types.ObjectId(warehouse);
    if (category) match.category = new (await import('mongoose')).default.Types.ObjectId(category);
    if (from || to) {
      match.purchaseDate = {};
      if (from) match.purchaseDate.$gte = new Date(from);
      if (to) match.purchaseDate.$lte = new Date(to);
    }

    const agg = await Equipment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalItems: { $sum: '$quantity' },
          totalRecords: { $sum: 1 },
          totalSpent: { $sum: '$totalCost' },
        },
      },
    ]);

    return agg[0] || { totalItems: 0, totalRecords: 0, totalSpent: 0 };
  },
};
