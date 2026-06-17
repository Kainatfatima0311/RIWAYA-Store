import { StockEntry } from './stock-entry.model.js';
import { StockItem } from './stock-item.model.js';
import { Rack } from '../warehouse/rack.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { stockMovementService } from './stock-movement.service.js';

// Refresh denormalized totalQuantity on StockItem from all entries
const refreshItemTotal = async (stockItemId) => {
  const agg = await StockEntry.aggregate([
    { $match: { stockItem: new (await import('mongoose')).default.Types.ObjectId(stockItemId) } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  const total = agg[0]?.total || 0;
  await StockItem.findByIdAndUpdate(stockItemId, { totalQuantity: total });
  return total;
};

const refreshRackOccupancy = async (rackId) => {
  const agg = await StockEntry.aggregate([
    { $match: { rack: new (await import('mongoose')).default.Types.ObjectId(rackId) } },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);
  const total = agg[0]?.total || 0;
  await Rack.findByIdAndUpdate(rackId, { currentOccupancy: total });
};

// Compute weighted-average unit cost when receiving at a new cost
const updateAverageCost = async (item, incomingQty, incomingUnitCost) => {
  if (incomingUnitCost == null) return;
  const currentQty = item.totalQuantity || 0;
  const currentCost = item.unitCost || 0;
  const totalQtyAfter = currentQty + incomingQty;
  const weighted =
    totalQtyAfter > 0
      ? (currentQty * currentCost + incomingQty * incomingUnitCost) / totalQtyAfter
      : incomingUnitCost;
  item.unitCost = +weighted.toFixed(2);
  item.lastCost = +incomingUnitCost.toFixed(2);
  await item.save();
};

// Resolve rack and validate against warehouse capacity
const loadRack = async (rackId) => {
  const rack = await Rack.findById(rackId);
  if (!rack) throw ApiError.notFound('Rack not found');
  if (!rack.isActive) throw ApiError.badRequest('Rack is inactive');
  return rack;
};

const checkRackCapacity = (rack, addingQty) => {
  if (rack.capacity && rack.currentOccupancy + addingQty > rack.capacity) {
    const available = rack.capacity - rack.currentOccupancy;
    throw ApiError.badRequest(
      `Rack '${rack.code}' has insufficient capacity. Adding ${addingQty}, only ${available} space remaining.`
    );
  }
};

export const stockEntryService = {
  // ===== RECEIVE (positive movement into a rack) =====
  async receive(stockItemId, { rack: rackId, quantity, unitCost, reason, reference, notes }, userId) {
    if (quantity <= 0) throw ApiError.badRequest('Quantity must be positive');

    const item = await StockItem.findById(stockItemId);
    if (!item) throw ApiError.notFound('Stock item not found');

    const rack = await loadRack(rackId);
    checkRackCapacity(rack, quantity);

    // Upsert entry
    let entry = await StockEntry.findOne({ stockItem: stockItemId, rack: rackId });
    if (!entry) {
      entry = await StockEntry.create({
        stockItem: stockItemId,
        warehouse: rack.warehouse,
        floor: rack.floor,
        rack: rackId,
        quantity,
        lastReceivedAt: new Date(),
      });
    } else {
      entry.quantity += quantity;
      entry.lastReceivedAt = new Date();
      await entry.save();
    }

    // Refresh denormalized totals
    const total = await refreshItemTotal(stockItemId);
    await refreshRackOccupancy(rackId);

    // Average cost
    await updateAverageCost(item, quantity, unitCost);

    // Log movement
    await stockMovementService.record({
      stockItem: stockItemId,
      stockItemName: item.name,
      stockItemSku: item.sku,
      type: 'receive',
      quantity,
      toRack: rackId,
      warehouse: rack.warehouse,
      unitCost: unitCost ?? item.unitCost,
      reason: reason || 'Stock received',
      reference,
      notes,
      performedBy: userId,
      balanceAfter: total,
    });

    return { entry, totalQuantity: total };
  },

  // ===== TRANSFER (between racks within or across warehouses) =====
  async transfer(stockItemId, { fromRack: fromId, toRack: toId, quantity, reason, notes }, userId) {
    if (quantity <= 0) throw ApiError.badRequest('Quantity must be positive');
    if (String(fromId) === String(toId)) {
      throw ApiError.badRequest('Source and destination racks must be different');
    }

    const item = await StockItem.findById(stockItemId);
    if (!item) throw ApiError.notFound('Stock item not found');

    const [fromRack, toRack] = await Promise.all([loadRack(fromId), loadRack(toId)]);

    const fromEntry = await StockEntry.findOne({ stockItem: stockItemId, rack: fromId });
    if (!fromEntry || fromEntry.quantity < quantity) {
      throw ApiError.badRequest(
        `Insufficient stock in source rack. Available: ${fromEntry?.quantity || 0}, requested: ${quantity}`
      );
    }

    checkRackCapacity(toRack, quantity);

    fromEntry.quantity -= quantity;
    fromEntry.lastMovedAt = new Date();
    await fromEntry.save();

    let toEntry = await StockEntry.findOne({ stockItem: stockItemId, rack: toId });
    if (!toEntry) {
      toEntry = await StockEntry.create({
        stockItem: stockItemId,
        warehouse: toRack.warehouse,
        floor: toRack.floor,
        rack: toId,
        quantity,
        lastReceivedAt: new Date(),
      });
    } else {
      toEntry.quantity += quantity;
      toEntry.lastReceivedAt = new Date();
      await toEntry.save();
    }

    await Promise.all([refreshRackOccupancy(fromId), refreshRackOccupancy(toId)]);
    const total = await refreshItemTotal(stockItemId);

    const baseRef = { kind: 'transfer' };
    await Promise.all([
      stockMovementService.record({
        stockItem: stockItemId,
        stockItemName: item.name,
        stockItemSku: item.sku,
        type: 'transfer_out',
        quantity: -quantity,
        fromRack: fromId,
        toRack: toId,
        warehouse: fromRack.warehouse,
        unitCost: item.unitCost,
        reason: reason || 'Stock transfer',
        reference: baseRef,
        notes,
        performedBy: userId,
        balanceAfter: total,
      }),
      stockMovementService.record({
        stockItem: stockItemId,
        stockItemName: item.name,
        stockItemSku: item.sku,
        type: 'transfer_in',
        quantity,
        fromRack: fromId,
        toRack: toId,
        warehouse: toRack.warehouse,
        unitCost: item.unitCost,
        reason: reason || 'Stock transfer',
        reference: baseRef,
        notes,
        performedBy: userId,
        balanceAfter: total,
      }),
    ]);

    return { fromEntry, toEntry, totalQuantity: total };
  },

  // ===== ADJUST (positive or negative manual correction) =====
  async adjust(stockItemId, { rack: rackId, delta, reason, notes }, userId) {
    if (delta === 0) throw ApiError.badRequest('Delta must be non-zero');

    const item = await StockItem.findById(stockItemId);
    if (!item) throw ApiError.notFound('Stock item not found');

    const rack = await loadRack(rackId);

    let entry = await StockEntry.findOne({ stockItem: stockItemId, rack: rackId });
    if (!entry && delta < 0) {
      throw ApiError.badRequest('No stock in this rack to deduct');
    }
    if (!entry) {
      entry = await StockEntry.create({
        stockItem: stockItemId,
        warehouse: rack.warehouse,
        floor: rack.floor,
        rack: rackId,
        quantity: 0,
      });
    }

    const newQty = entry.quantity + delta;
    if (newQty < 0) {
      throw ApiError.badRequest(`Adjustment would make rack negative (current ${entry.quantity}, delta ${delta})`);
    }
    if (delta > 0) checkRackCapacity(rack, delta);

    entry.quantity = newQty;
    entry.lastMovedAt = new Date();
    await entry.save();

    await refreshRackOccupancy(rackId);
    const total = await refreshItemTotal(stockItemId);

    await stockMovementService.record({
      stockItem: stockItemId,
      stockItemName: item.name,
      stockItemSku: item.sku,
      type: delta > 0 ? 'adjust_in' : 'adjust_out',
      quantity: delta,
      fromRack: delta < 0 ? rackId : undefined,
      toRack: delta > 0 ? rackId : undefined,
      warehouse: rack.warehouse,
      unitCost: item.unitCost,
      reason,
      reference: { kind: 'manual' },
      notes,
      performedBy: userId,
      balanceAfter: total,
    });

    return { entry, totalQuantity: total };
  },

  // ===== WRITE-OFF (damage/loss) =====
  async writeOff(stockItemId, { rack: rackId, quantity, reason, notes }, userId) {
    if (quantity <= 0) throw ApiError.badRequest('Quantity must be positive');

    const item = await StockItem.findById(stockItemId);
    if (!item) throw ApiError.notFound('Stock item not found');

    const rack = await loadRack(rackId);
    const entry = await StockEntry.findOne({ stockItem: stockItemId, rack: rackId });
    if (!entry || entry.quantity < quantity) {
      throw ApiError.badRequest(
        `Insufficient stock to write off. Available: ${entry?.quantity || 0}, requested: ${quantity}`
      );
    }

    entry.quantity -= quantity;
    entry.lastMovedAt = new Date();
    await entry.save();

    await refreshRackOccupancy(rackId);
    const total = await refreshItemTotal(stockItemId);

    await stockMovementService.record({
      stockItem: stockItemId,
      stockItemName: item.name,
      stockItemSku: item.sku,
      type: 'write_off',
      quantity: -quantity,
      fromRack: rackId,
      warehouse: rack.warehouse,
      unitCost: item.unitCost,
      reason,
      reference: { kind: 'manual' },
      notes,
      performedBy: userId,
      balanceAfter: total,
    });

    return { entry, totalQuantity: total };
  },

  // ===== LIST per-rack distribution =====
  async listByItem(stockItemId) {
    return StockEntry.find({ stockItem: stockItemId })
      .populate('warehouse', 'name code')
      .populate('floor', 'floorNumber name')
      .populate('rack', 'code name capacity')
      .sort('-quantity');
  },
};
