import mongoose from 'mongoose';

export const SUPPLIER_TYPES = Object.freeze(['mill', 'distributor', 'individual', 'wholesaler', 'other']);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 300 },
    line2: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 80 },
    province: { type: String, trim: true, maxlength: 80 },
    country: { type: String, default: 'Pakistan', trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false }
);

const bankSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true, maxlength: 120 },
    accountTitle: { type: String, trim: true, maxlength: 120 },
    accountNumber: { type: String, trim: true, maxlength: 40 },
    iban: { type: String, trim: true, maxlength: 40 },
    branchCode: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false }
);

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      unique: true,
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
      // auto-generated if not supplied (SUP-0001)
    },
    type: { type: String, enum: SUPPLIER_TYPES, default: 'mill', index: true },

    // Contact
    contactPerson: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    alternatePhone: { type: String, trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    website: { type: String, trim: true, maxlength: 200 },

    address: { type: addressSchema, default: () => ({}) },

    // Tax / legal IDs (Pakistan)
    ntn: { type: String, trim: true, maxlength: 30 },
    gst: { type: String, trim: true, maxlength: 30 },
    cnic: { type: String, trim: true, maxlength: 20 }, // for individual suppliers

    // Banking
    bank: { type: bankSchema, default: () => ({}) },

    // Commercial terms
    paymentTerms: { type: String, trim: true, maxlength: 120 }, // e.g. "Net 30", "COD", "50% advance"
    creditLimit: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'PKR', trim: true, maxlength: 8 },

    // Running totals (denormalized — updated by PO service)
    totalPurchases: { type: Number, default: 0, min: 0 },           // grandTotal sum of approved POs
    totalPaid: { type: Number, default: 0, min: 0 },                 // sum of payments made
    activePoCount: { type: Number, default: 0, min: 0 },

    rating: { type: Number, min: 0, max: 5, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000 },
    tags: [{ type: String, trim: true, maxlength: 40 }],

    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 'text', code: 'text', contactPerson: 'text' });
supplierSchema.index({ type: 1, isActive: 1 });

supplierSchema.virtual('outstandingBalance').get(function () {
  return Math.max(0, (this.totalPurchases || 0) - (this.totalPaid || 0));
});

supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

export const Supplier = mongoose.model('Supplier', supplierSchema);
