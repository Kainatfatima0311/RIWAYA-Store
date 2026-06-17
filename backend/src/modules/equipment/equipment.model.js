import mongoose from 'mongoose';

export const EQUIPMENT_CONDITIONS = Object.freeze([
  'new',
  'working',
  'needs_repair',
  'under_repair',
  'retired',
  'lost',
]);

export const EQUIPMENT_STATUS = Object.freeze(['active', 'retired', 'lost']);

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    contactPerson: { type: String, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    address: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { _id: true, timestamps: false }
);

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
      maxlength: 150,
      // e.g. "HP LaserJet Pro M1136", "Dell Latitude 5420", "Geepas Pedestal Fan"
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EquipmentCategory',
      required: true,
      index: true,
    },

    brand: { type: String, trim: true, maxlength: 80 },
    model: { type: String, trim: true, maxlength: 80 },
    serialNumber: { type: String, trim: true, maxlength: 80, index: true, sparse: true },

    // Quantity: 1 for unique items (laptop with serial), N for bulk (10 fans of same model)
    quantity: { type: Number, required: true, min: 1, default: 1 },

    purchaseDate: { type: Date, required: true },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, min: 0 }, // auto = unitCost * quantity
    currency: { type: String, default: 'PKR', trim: true, maxlength: 8 },

    vendor: { type: vendorSchema, default: () => ({}) },
    invoiceNumber: { type: String, trim: true, maxlength: 60 },
    invoiceUrl: { type: String, trim: true }, // optional uploaded receipt

    warrantyMonths: { type: Number, min: 0, default: 0 },
    warrantyExpiry: { type: Date }, // auto-computed from purchaseDate + warrantyMonths

    // Location
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor' },
    rack: { type: mongoose.Schema.Types.ObjectId, ref: 'Rack' },

    // Assignment (optional)
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date },

    condition: { type: String, enum: EQUIPMENT_CONDITIONS, default: 'new', index: true },
    status: { type: String, enum: EQUIPMENT_STATUS, default: 'active', index: true },

    photos: [photoSchema],
    notes: { type: String, trim: true, maxlength: 1000 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

equipmentSchema.index({ warehouse: 1, status: 1, condition: 1 });
equipmentSchema.index({ name: 'text', brand: 'text', model: 'text', serialNumber: 'text' });

// Auto-compute totalCost and warrantyExpiry
equipmentSchema.pre('validate', function (next) {
  if (this.unitCost != null && this.quantity != null) {
    this.totalCost = +(this.unitCost * this.quantity).toFixed(2);
  }
  if (this.purchaseDate && this.warrantyMonths > 0) {
    const expiry = new Date(this.purchaseDate);
    expiry.setMonth(expiry.getMonth() + this.warrantyMonths);
    this.warrantyExpiry = expiry;
  } else if (this.purchaseDate && !this.warrantyMonths) {
    this.warrantyExpiry = undefined;
  }
  next();
});

equipmentSchema.virtual('isUnderWarranty').get(function () {
  return this.warrantyExpiry ? this.warrantyExpiry > new Date() : false;
});

equipmentSchema.set('toJSON', { virtuals: true });
equipmentSchema.set('toObject', { virtuals: true });

export const Equipment = mongoose.model('Equipment', equipmentSchema);
