import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    area: { type: String, trim: true },          // e.g. "DHA Phase 5", "Gulberg"
    city: { type: String, required: true, trim: true },
    province: { type: String, trim: true },
    country: { type: String, default: 'Pakistan', trim: true },
    postalCode: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      unique: true,
      trim: true,
      maxlength: 120,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
      // e.g. "WH-LHR-01"
    },
    location: { type: locationSchema, required: true },

    // Size: support local (marla) and universal (sqft) units
    areaMarla: { type: Number, min: 0 },
    areaSqft: { type: Number, min: 0 },

    totalFloors: { type: Number, min: 0, default: 0 },        // auto-updated via Floor hooks
    totalRacks: { type: Number, min: 0, default: 0 },          // auto-updated via Rack hooks

    storageCapacity: { type: Number, min: 0, default: 0 },     // total intended capacity (units)
    currentOccupancy: { type: Number, min: 0, default: 0 },    // updated by stock module later

    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, trim: true, maxlength: 1000 },

    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

warehouseSchema.index({ name: 'text', code: 'text', 'location.city': 'text' });
warehouseSchema.index({ isActive: 1, createdAt: -1 });

warehouseSchema.virtual('occupancyPercent').get(function () {
  if (!this.storageCapacity) return 0;
  return Math.round((this.currentOccupancy / this.storageCapacity) * 100);
});

warehouseSchema.set('toJSON', { virtuals: true });
warehouseSchema.set('toObject', { virtuals: true });

export const Warehouse = mongoose.model('Warehouse', warehouseSchema);
