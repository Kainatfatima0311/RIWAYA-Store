import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, trim: true, maxlength: 40 },
    size: { type: String, trim: true, maxlength: 20 },     // S, M, L, XL, XXL, custom
    fabric: { type: String, trim: true, maxlength: 60 },   // Cotton, Lawn, Silk, Chiffon
    pattern: { type: String, trim: true, maxlength: 60 },  // Embroidered, Plain, Printed
    season: { type: String, trim: true, maxlength: 30 },   // Summer, Winter, Eid, Bridal
    gender: { type: String, trim: true, maxlength: 20 },   // Men, Women, Unisex, Kids
  },
  { _id: false }
);

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { _id: true }
);

const stockItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
    barcode: { type: String, unique: true, sparse: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 2000 },

    rackCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'RackCategory', index: true },
    defaultRack: { type: mongoose.Schema.Types.ObjectId, ref: 'Rack' },

    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', index: true },

    unit: { type: String, default: 'pcs', trim: true, maxlength: 20 },
    currency: { type: String, default: 'PKR', trim: true, maxlength: 8 },

    // Costing
    unitCost: { type: Number, default: 0, min: 0 },        // weighted average
    lastCost: { type: Number, default: 0, min: 0 },        // most recent receive cost

    variant: { type: variantSchema, default: () => ({}) },

    // Denormalized levels — updated by stock-entry service
    totalQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 }, // for pending orders (Phase 8)

    // Thresholds
    minStockLevel: { type: Number, default: 10, min: 0 },
    reorderLevel: { type: Number, default: 5, min: 0 },
    maxStockLevel: { type: Number, default: 0, min: 0 },   // 0 = no max

    photos: [photoSchema],
    tags: [{ type: String, trim: true, maxlength: 40 }],

    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockItemSchema.index({ name: 'text', sku: 'text', description: 'text', barcode: 'text' });
stockItemSchema.index({ isActive: 1, totalQuantity: 1 });
stockItemSchema.index({ rackCategory: 1, isActive: 1 });

stockItemSchema.virtual('availableQuantity').get(function () {
  return Math.max(0, (this.totalQuantity || 0) - (this.reservedQuantity || 0));
});

stockItemSchema.virtual('stockStatus').get(function () {
  const total = this.totalQuantity || 0;
  if (total <= 0) return 'out_of_stock';
  if (total <= this.reorderLevel) return 'urgent';
  if (total <= this.minStockLevel) return 'low';
  return 'ok';
});

stockItemSchema.set('toJSON', { virtuals: true });
stockItemSchema.set('toObject', { virtuals: true });

export const StockItem = mongoose.model('StockItem', stockItemSchema);
