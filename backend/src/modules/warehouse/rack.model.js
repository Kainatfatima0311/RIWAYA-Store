import mongoose from 'mongoose';

export const RACK_TYPES = Object.freeze(['rack', 'cupboard', 'shelf', 'pallet']);

const rackSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: true,
      index: true,
    },
    rackCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RackCategory',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
      // e.g. "F1-R12", "GR-C04"
    },
    name: { type: String, trim: true, maxlength: 80 },
    type: { type: String, enum: RACK_TYPES, default: 'rack' },

    capacity: { type: Number, required: true, min: 0, default: 0 },        // max units
    currentOccupancy: { type: Number, min: 0, default: 0 },                 // updated by stock module

    position: {
      row: { type: Number, min: 0 },
      column: { type: Number, min: 0 },
    },

    description: { type: String, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Unique code within a warehouse
rackSchema.index({ warehouse: 1, code: 1 }, { unique: true });
rackSchema.index({ warehouse: 1, floor: 1, isActive: 1 });
rackSchema.index({ rackCategory: 1 });

rackSchema.virtual('occupancyPercent').get(function () {
  if (!this.capacity) return 0;
  return Math.round((this.currentOccupancy / this.capacity) * 100);
});

rackSchema.virtual('availableSpace').get(function () {
  return Math.max(0, (this.capacity || 0) - (this.currentOccupancy || 0));
});

rackSchema.set('toJSON', { virtuals: true });
rackSchema.set('toObject', { virtuals: true });

export const Rack = mongoose.model('Rack', rackSchema);
