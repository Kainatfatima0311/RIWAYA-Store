import mongoose from 'mongoose';

const floorSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    floorNumber: {
      type: Number,
      required: true,
      min: 0,
      // 0 = ground, 1 = first, ...
    },
    name: { type: String, trim: true, maxlength: 60 }, // e.g. "Ground", "Mezzanine"
    areaSqft: { type: Number, min: 0 },
    description: { type: String, trim: true, maxlength: 500 },

    totalRacks: { type: Number, default: 0, min: 0 },  // auto-updated by Rack hooks

    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One floor number per warehouse
floorSchema.index({ warehouse: 1, floorNumber: 1 }, { unique: true });
floorSchema.index({ warehouse: 1, isActive: 1 });

export const Floor = mongoose.model('Floor', floorSchema);
