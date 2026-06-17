import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../../middleware/role.middleware.js';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home', trim: true },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    province: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, default: 'Pakistan', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      index: true,
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    addresses: [addressSchema],
    isActive: { type: Boolean, default: true },

    // For customer role — distinguishes online signup vs walk-in (added by manager)
    customerType: {
      type: String,
      enum: ['online', 'walk_in'],
      default: 'online',
    },

    // Who created this user (useful for walk-in customers / staff)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    lastLogin: Date,
  },
  { timestamps: true }
);

// ===== Indexes =====
userSchema.index({ role: 1, customerType: 1 });
userSchema.index({ createdAt: -1 });

// ===== Hooks =====
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ===== Methods =====
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model('User', userSchema);
