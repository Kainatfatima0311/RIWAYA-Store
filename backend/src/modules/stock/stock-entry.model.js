import mongoose from 'mongoose';

const stockEntrySchema = new mongoose.Schema(
  {
    stockItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockItem',
      required: true,
      index: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor' },
    rack: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rack',
      required: true,
      index: true,
    },

    quantity: { type: Number, default: 0, min: 0 },

    lastReceivedAt: Date,
    lastMovedAt: Date,
  },
  { timestamps: true }
);

// One entry per (stockItem, rack) — receiving same item again merges into existing
stockEntrySchema.index({ stockItem: 1, rack: 1 }, { unique: true });
stockEntrySchema.index({ warehouse: 1, quantity: 1 });

export const StockEntry = mongoose.model('StockEntry', stockEntrySchema);
