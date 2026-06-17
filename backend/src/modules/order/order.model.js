import mongoose from 'mongoose';

export const ORDER_TYPES = Object.freeze(['online', 'physical']);

export const ORDER_STATUS = Object.freeze([
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
  'refunded',
]);

export const ORDER_PAYMENT_STATUS = Object.freeze([
  'unpaid',
  'partial',
  'paid',
  'partially_refunded',
  'refunded',
]);

export const SHIPPING_METHODS = Object.freeze(['standard', 'express', 'same_day', 'pickup', 'walk_in']);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30 },
    line1: { type: String, trim: true, maxlength: 300 },
    line2: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 80 },
    province: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, default: 'Pakistan', trim: true, maxlength: 80 },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    stockItem: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true },

    // Snapshots (so the order is readable even if product changes later)
    productName: { type: String, required: true, trim: true, maxlength: 200 },
    productSku: { type: String, trim: true, maxlength: 80 },
    variantLabel: { type: String, trim: true, maxlength: 120 },
    productImage: { type: String, trim: true },

    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, min: 0 },
  },
  { _id: true }
);

orderItemSchema.pre('validate', function (next) {
  if (this.unitPrice != null && this.quantity != null) {
    this.totalPrice = +(this.unitPrice * this.quantity).toFixed(2);
  }
  next();
});

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUS, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { _id: true }
);

const courierSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 80 }, // TCS, Leopards, M&P, BlueEx
    trackingNumber: { type: String, trim: true, maxlength: 80 },
    trackingUrl: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },

    orderType: { type: String, enum: ORDER_TYPES, required: true, index: true },

    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },

    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },

    // Financials
    subtotal: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    discountCode: { type: String, trim: true, maxlength: 40 },
    grandTotal: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    refundedAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'PKR', trim: true, maxlength: 8 },

    // Addresses (snapshots)
    shippingAddress: { type: addressSchema },
    billingAddress: { type: addressSchema },

    // Status
    status: { type: String, enum: ORDER_STATUS, default: 'pending', index: true },
    paymentStatus: { type: String, enum: ORDER_PAYMENT_STATUS, default: 'unpaid', index: true },
    statusHistory: [statusHistorySchema],

    // Stock fulfillment tracking
    stockReserved: { type: Boolean, default: false },
    stockFulfilled: { type: Boolean, default: false },
    fulfillmentNotes: { type: String, trim: true, maxlength: 500 },

    // Shipping
    shippingMethod: { type: String, enum: SHIPPING_METHODS, default: 'standard' },
    courier: { type: courierSchema, default: () => ({}) },
    estimatedDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },

    // For physical / walk-in
    storeLocation: { type: String, trim: true, maxlength: 200 },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

    // Notes
    customerNotes: { type: String, trim: true, maxlength: 1000 },
    internalNotes: { type: String, trim: true, maxlength: 1000 },

    // Cancellation / Return
    cancelReason: { type: String, trim: true, maxlength: 500 },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    returnReason: { type: String, trim: true, maxlength: 500 },
    returnedAt: { type: Date },
    returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    orderedAt: { type: Date, default: Date.now, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // staff for physical orders
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, orderedAt: -1 });
orderSchema.index({ status: 1, orderedAt: -1 });
orderSchema.index({ paymentStatus: 1, orderedAt: -1 });
orderSchema.index({ orderType: 1, orderedAt: -1 });
orderSchema.index({ orderNumber: 'text' });

orderSchema.virtual('outstandingAmount').get(function () {
  return Math.max(0, (this.grandTotal || 0) - (this.paidAmount || 0));
});

orderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((s, it) => s + it.quantity, 0);
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

export const Order = mongoose.model('Order', orderSchema);
