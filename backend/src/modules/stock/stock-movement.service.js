import { StockMovement } from './stock-movement.model.js';

export const stockMovementService = {
  /**
   * Record a stock movement (audit log entry). Called by stock-entry service.
   */
  async record({
    stockItem,
    stockItemName,
    stockItemSku,
    type,
    quantity,
    fromRack,
    toRack,
    warehouse,
    unitCost,
    reason,
    reference,
    notes,
    performedBy,
    balanceAfter,
  }) {
    return StockMovement.create({
      stockItem,
      stockItemName,
      stockItemSku,
      type,
      quantity,
      fromRack,
      toRack,
      warehouse,
      unitCost,
      totalValue: unitCost != null ? +(unitCost * Math.abs(quantity)).toFixed(2) : undefined,
      reason,
      reference,
      notes,
      performedBy,
      balanceAfter,
      performedAt: new Date(),
    });
  },

  async list({
    page = 1,
    limit = 50,
    stockItem,
    warehouse,
    rack,
    type,
    referenceKind,
    referenceId,
    from,
    to,
    sort = '-performedAt',
  }) {
    const filter = {};
    if (stockItem) filter.stockItem = stockItem;
    if (warehouse) filter.warehouse = warehouse;
    if (type) filter.type = type;
    if (rack) {
      filter.$or = [{ fromRack: rack }, { toRack: rack }];
    }
    if (referenceKind) filter['reference.kind'] = referenceKind;
    if (referenceId) filter['reference.id'] = referenceId;
    if (from || to) {
      filter.performedAt = {};
      if (from) filter.performedAt.$gte = from;
      if (to) filter.performedAt.$lte = to;
    }

    const [items, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('stockItem', 'name sku')
        .populate('fromRack', 'code name')
        .populate('toRack', 'code name')
        .populate('warehouse', 'name code')
        .populate('performedBy', 'name email role')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      StockMovement.countDocuments(filter),
    ]);

    return { items, page, limit, total };
  },
};
