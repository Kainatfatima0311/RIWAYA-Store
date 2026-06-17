import { Supplier } from './supplier.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatSequenceNoYear } from '../../utils/counter.js';

export const supplierService = {
  async create(payload, userId) {
    let code = payload.code?.toUpperCase();
    if (!code) {
      code = await formatSequenceNoYear('supplier', 'SUP');
    }

    const existing = await Supplier.findOne({ $or: [{ name: payload.name }, { code }] });
    if (existing) {
      const dup = existing.name === payload.name ? 'name' : 'code';
      throw ApiError.conflict(`Supplier ${dup} already exists`);
    }

    return Supplier.create({ ...payload, code, createdBy: userId });
  },

  async list({ page = 1, limit = 20, search, type, isActive, city, sort = '-createdAt' }) {
    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') },
        { contactPerson: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Supplier.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Supplier.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },

  async getById(id) {
    const sup = await Supplier.findById(id);
    if (!sup) throw ApiError.notFound('Supplier not found');
    return sup;
  },

  async update(id, payload, userId) {
    const sup = await Supplier.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!sup) throw ApiError.notFound('Supplier not found');
    return sup;
  },

  async remove(id) {
    // Lazy import to avoid circular dep
    const { PurchaseOrder } = await import('../purchase-order/purchase-order.model.js');
    const poCount = await PurchaseOrder.countDocuments({ supplier: id });
    if (poCount) {
      throw ApiError.conflict(
        `Cannot delete: supplier has ${poCount} purchase order(s). Deactivate instead.`
      );
    }
    const sup = await Supplier.findByIdAndDelete(id);
    if (!sup) throw ApiError.notFound('Supplier not found');
    return sup;
  },

  // Internal: called by PO service when PO is approved / payment recorded
  async adjustTotals(supplierId, { purchaseDelta = 0, paidDelta = 0, poDelta = 0 }) {
    await Supplier.findByIdAndUpdate(supplierId, {
      $inc: {
        totalPurchases: purchaseDelta,
        totalPaid: paidDelta,
        activePoCount: poDelta,
      },
    });
  },
};
