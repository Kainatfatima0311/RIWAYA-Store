import mongoose from 'mongoose';

export const MOVEMENT_TYPES = Object.freeze([
  'receive',         // +qty, into a rack (from supplier or initial)
  'transfer_out',    // -qty, leaving a rack (paired with transfer_in)
  'transfer_in',     // +qty, arriving at a rack (paired with transfer_out)
  'sale',            // -qty, sold to customer (Phase 8)
  'return',          // +qty, customer returned (Phase 8)
  'adjust_in',       // +qty, manual correction
  'adjust_out',      // -qty, manual correction
  'write_off',       // -qty, damage / loss / expiry
  'reserve',         // for pending order (no physical move)
  'unreserve',
]);

export const REFERENCE_KINDS = Object.freeze([
  'purchase_order',
  'order',
  'manual',
  'transfer',
  'return',
]);

const stockMovementSchema = new mongoose.Schema(
  {
    stockItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true,
      index: true,
    },
    stockItemName: { type: String, trim: true }, // snapshot
    stockItemSku: { type: String, trim: true },  // snapshot

    type: { type: String, enum: MOVEMENT_TYPES, required: true, index: true },
    quantity: { type: Number, required: true }, // positive=in, negative=out

    fromRack: { type: mongoose.Schema.Types.ObjectId, ref: 'Rack' },
    toRack: { type: mongoose.Schema.Types.ObjectId, ref: 'Rack' },

    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', index: true },

    unitCost: { type: Number, min: 0 }, // valuation snapshot
    totalValue: { type: Number, min: 0 },

    reason: { type: String, trim: true, maxlength: 300 },

    reference: {
      kind: { type: String, enum: REFERENCE_KINDS },
      id: { type: mongoose.Schema.Types.ObjectId },
      label: { type: String, trim: true }, // e.g. "PO-2026-0001"
    },

    notes: { type: String, trim: true, maxlength: 500 },

    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedAt: { type: Date, default: Date.now, index: true },

    // Resulting state snapshot (for audit)
    balanceAfter: { type: Number, min: 0 },
  },
  { timestamps: true }
);

stockMovementSchema.index({ stockItem: 1, performedAt: -1 });
stockMovementSchema.index({ type: 1, performedAt: -1 });
stockMovementSchema.index({ warehouse: 1, performedAt: -1 });
stockMovementSchema.index({ 'reference.kind': 1, 'reference.id': 1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
