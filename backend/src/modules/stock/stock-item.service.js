import { StockItem } from './stock-item.model.js';
import { StockEntry } from './stock-entry.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatSequenceNoYear } from '../../utils/counter.js';
import { stockEntryService } from './stock-entry.service.js';
import { stockMovementService } from './stock-movement.service.js';

export const stockItemService = {
  async create(payload, userId) {
    let sku = payload.sku?.toUpperCase();
    if (!sku) sku = await formatSequenceNoYear('stock-sku', 'SKU', 5);

    const existing = await StockItem.findOne({ sku });
    if (existing) throw ApiError.conflict(`SKU '${sku}' already exists`);

    if (payload.barcode) {
      const dup = await StockItem.findOne({ barcode: payload.barcode });
      if (dup) throw ApiError.conflict('Barcode already exists');
    }

    return StockItem.create({ ...payload, sku, createdBy: userId });
  },

  async list({
    page = 1,
    limit = 20,
    search,
    rackCategory,
    supplier,
    isActive,
    stockStatus,
    sort = '-updatedAt',
  }) {
    const filter = {};
    if (rackCategory) filter.rackCategory = rackCategory;
    if (supplier) filter.supplier = supplier;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { barcode: new RegExp(search, 'i') },
      ];
    }

    // Stock status filter — uses runtime expression since virtuals can't be queried
    const items = await StockItem.find(filter)
      .populate('rackCategory', 'name color')
      .populate('supplier', 'name code')
      .populate('defaultRack', 'code name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    let filtered = items;
    if (stockStatus) {
      filtered = items.filter((it) => it.stockStatus === stockStatus);
    }

    const total = await StockItem.countDocuments(filter);
    return { items: filtered, page, limit, total };
  },

  async getById(id) {
    const item = await StockItem.findById(id)
      .populate('rackCategory', 'name color')
      .populate('supplier', 'name code phone')
      .populate('defaultRack', 'code name')
      .populate('createdBy', 'name email');
    if (!item) throw ApiError.notFound('Stock item not found');
    return item;
  },

  async update(id, payload, userId) {
    if (payload.sku) payload.sku = payload.sku.toUpperCase();
    if (payload.sku) {
      const dup = await StockItem.findOne({ sku: payload.sku, _id: { $ne: id } });
      if (dup) throw ApiError.conflict('SKU already in use');
    }
    if (payload.barcode) {
      const dup = await StockItem.findOne({ barcode: payload.barcode, _id: { $ne: id } });
      if (dup) throw ApiError.conflict('Barcode already in use');
    }

    const item = await StockItem.findByIdAndUpdate(
      id,
      { ...payload, updatedBy: userId },
      { new: true, runValidators: true }
    );
    if (!item) throw ApiError.notFound('Stock item not found');
    return item;
  },

  async remove(id) {
    const hasStock = await StockEntry.exists({ stockItem: id, quantity: { $gt: 0 } });
    if (hasStock) {
      throw ApiError.conflict('Cannot delete: stock item still has quantity in racks. Write off first.');
    }
    const item = await StockItem.findByIdAndDelete(id);
    if (!item) throw ApiError.notFound('Stock item not found');
    // Also remove zero-quantity entries
    await StockEntry.deleteMany({ stockItem: id });
    return item;
  },

  // ===== Low stock alerts =====
  async getLowStock({ warehouse } = {}) {
    // out_of_stock + urgent + low
    let items = await StockItem.find({ isActive: true })
      .populate('rackCategory', 'name color')
      .populate('supplier', 'name code phone email')
      .populate('defaultRack', 'code name')
      .sort('totalQuantity');

    items = items.filter((it) => it.stockStatus !== 'ok');

    if (warehouse) {
      // Filter to items that have presence in this warehouse
      const ids = items.map((i) => i._id);
      const entries = await StockEntry.find({ stockItem: { $in: ids }, warehouse }).distinct('stockItem');
      const presentIds = new Set(entries.map((id) => String(id)));
      items = items.filter((i) => presentIds.has(String(i._id)));
    }

    const grouped = {
      out_of_stock: items.filter((i) => i.stockStatus === 'out_of_stock'),
      urgent: items.filter((i) => i.stockStatus === 'urgent'),
      low: items.filter((i) => i.stockStatus === 'low'),
    };

    return {
      total: items.length,
      counts: {
        out_of_stock: grouped.out_of_stock.length,
        urgent: grouped.urgent.length,
        low: grouped.low.length,
      },
      groups: grouped,
    };
  },

  // ===== Pass-through operations to entry service =====
  receive: stockEntryService.receive,
  transfer: stockEntryService.transfer,
  adjust: stockEntryService.adjust,
  writeOff: stockEntryService.writeOff,
  entriesByItem: stockEntryService.listByItem,

  // Movements for one item
  movementsForItem: (stockItemId, query) =>
    stockMovementService.list({ ...query, stockItem: stockItemId }),
};
