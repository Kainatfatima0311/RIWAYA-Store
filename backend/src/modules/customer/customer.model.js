import mongoose from 'mongoose';

export const CUSTOMER_TYPES = Object.freeze(['online', 'walk_in']);
export const CUSTOMER_SEGMENTS = Object.freeze(['new', 'returning', 'vip', 'inactive', 'blocked']);
export const GENDERS = Object.freeze(['male', 'female', 'other', 'prefer_not_to_say']);
export const LANGUAGES = Object.freeze(['en', 'ur']);

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home', trim: true, maxlength: 30 },
    fullName: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30 },
    line1: { type: String, required: true, trim: true, maxlength: 300 },
    line2: { type: String, trim: true, maxlength: 300 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    province: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, default: 'Pakistan', trim: true, maxlength: 80 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const customerSchema = new mongoose.Schema(
  {
    // Optional link to a User account (absent for walk-in customers without login).
    // NOTE: no `default: null` — a sparse unique index only skips documents where
    // the field is ABSENT, not those explicitly set to null. Defaulting to null made
    // every walk-in write `user: null`, so the 2nd walk-in collided on the unique
    // index ("Duplicate value 'null' for field 'user'"). Leaving it unset keeps the
    // field absent for walk-ins so the sparse unique index ignores them entirely.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      unique: true,
    },

    customerCode: { type: String, unique: true, uppercase: true, trim: true, maxlength: 20 },

    // Identity (always required — name + phone are minimum)
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, sparse: true, index: true },
    phone: { type: String, trim: true, maxlength: 30, index: true },
    alternatePhone: { type: String, trim: true, maxlength: 30 },
    cnic: { type: String, trim: true, maxlength: 20, sparse: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: GENDERS },

    customerType: { type: String, enum: CUSTOMER_TYPES, required: true, index: true },

    addresses: [addressSchema],

    // Segmentation
    tags: [{ type: String, trim: true, maxlength: 40 }],
    segment: { type: String, enum: CUSTOMER_SEGMENTS, default: 'new', index: true },
    preferredCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' }],

    // Communication preferences
    marketingOptIn: { type: Boolean, default: false },
    preferredLanguage: { type: String, enum: LANGUAGES, default: 'en' },

    // Stats (denormalized — updated by order service in Phase 8)
    totalOrders: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    averageOrderValue: { type: Number, default: 0, min: 0 },
    lastOrderAt: { type: Date },

    // For walk-in tracking
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // manager who added
    source: { type: String, trim: true, maxlength: 60 }, // referral / walk-in / online / facebook / instagram

    notes: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', email: 'text', phone: 'text', customerCode: 'text' });
customerSchema.index({ customerType: 1, segment: 1, isActive: 1 });
customerSchema.index({ createdAt: -1 });
customerSchema.index({ totalSpent: -1 });

customerSchema.virtual('displayCode').get(function () {
  return this.customerCode || `CUST-${String(this._id).slice(-6).toUpperCase()}`;
});

customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

export const Customer = mongoose.model('Customer', customerSchema);
