import mongoose from 'mongoose';

export const PO_STATUS = Object.freeze([
  'draft',
  'placed',
  'partially_received',
  'fully_received',
  'cancelled',
]);

export const PO_PAYMENT_STATUS = Object.freeze(['unpaid', 'partial', 'paid']);

export const PAYMENT_METHODS = Object.freeze([
  'cash',
  'bank_transfer',
  'cheque',
  'online',
  'jazzcash',
  'easypaisa',
  'other',
]);

const poItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 500 },
    sku: { type: String, trim: true, maxlength: 80 },
    variant: { type: String, trim: true, maxlength: 120 }, // colour/size/fabric
    unit: { type: String, default: 'pcs', trim: true, maxlength: 20 }, // pcs, mtr, kg, suits

    quantityOrdered: { type: Number, required: true, min: 1 },
    quantityReceived: { type: Number, default: 0, min: 0 },

    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, min: 0 }, // auto = unitPrice * quantityOrdered
  },
  { _id: true }
);

poItemSchema.pre('validate', function (next) {
  if (this.unitPrice != null && this.quantityOrdered != null) {
    this.totalPrice = +(this.unitPrice * this.quantityOrdered).toFixed(2);
  }
  next();
});

const receiptItemSchema = new mongoose.Schema(
  {
    poItem: { type: mongoose.Schema.Types.ObjectId, required: true }, // ref to PO item subdoc _id
    name: { type: String, trim: true }, // snapshot for readability
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true, maxlength: 300 },
  },
  { _id: true }
);

const receiptSchema = new mongoose.Schema(
  {
    receivedAt: { type: Date, default: Date.now },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [receiptItemSchema],
    notes: { type: String, trim: true, maxlength: 500 },
    documentUrl: { type: String, trim: true }, // optional delivery note photo
  },
  { _id: true, timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    paidAt: { type: Date, default: Date.now },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    reference: { type: String, trim: true, maxlength: 100 }, // cheque #, transaction id
    notes: { type: String, trim: true, maxlength: 300 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: true, timestamps: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },

    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },

    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },

    items: { type: [poItemSchema], validate: (v) => v.length > 0 },

    // Financials (computed via service when items change)
    subtotal: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },        // %
    taxAmount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 },

    paidAmount: { type: Number, default: 0, min: 0 },

    currency: { type: String, default: 'PKR', trim: true, maxlength: 8 },

    receipts: [receiptSchema],
    payments: [paymentSchema],

    status: { type: String, enum: PO_STATUS, default: 'draft', index: true },
    paymentStatus: { type: String, enum: PO_PAYMENT_STATUS, default: 'unpaid', index: true },

    notes: { type: String, trim: true, maxlength: 1000 },
    internalNotes: { type: String, trim: true, maxlength: 1000 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ supplier: 1, status: 1 });
purchaseOrderSchema.index({ warehouse: 1, status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ poNumber: 'text' });

purchaseOrderSchema.virtual('outstandingAmount').get(function () {
  return Math.max(0, (this.grandTotal || 0) - (this.paidAmount || 0));
});

purchaseOrderSchema.set('toJSON', { virtuals: true });
purchaseOrderSchema.set('toObject', { virtuals: true });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
