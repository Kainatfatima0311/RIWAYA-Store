import mongoose from 'mongoose';

export const PAYMENT_METHODS = Object.freeze([
  'cash',
  'cod',
  'stripe',
  'jazzcash',
  'easypaisa',
  'bank_transfer',
  'cheque',
  'card',
  'other',
]);

export const PAYMENT_STATUS = Object.freeze(['pending', 'completed', 'failed', 'refunded', 'cancelled']);

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },

    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'PKR', trim: true, maxlength: 8 },

    method: { type: String, enum: PAYMENT_METHODS, required: true, index: true },
    status: { type: String, enum: PAYMENT_STATUS, default: 'pending', index: true },

    // Gateway-specific
    transactionId: { type: String, trim: true, maxlength: 120, index: true, sparse: true },
    gateway: { type: String, trim: true, maxlength: 60 }, // stripe, jazzcash, easypaisa
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },

    // Card-specific (Stripe)
    cardLast4: { type: String, trim: true, maxlength: 4 },
    cardBrand: { type: String, trim: true, maxlength: 20 },

    // Bank transfer / cheque
    bankName: { type: String, trim: true, maxlength: 120 },
    chequeNumber: { type: String, trim: true, maxlength: 60 },
    chequeDate: { type: Date },
    referenceNumber: { type: String, trim: true, maxlength: 100 },

    paidAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    failedAt: { type: Date },
    refundedAt: { type: Date },
    refundReason: { type: String, trim: true, maxlength: 500 },

    notes: { type: String, trim: true, maxlength: 500 },

    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1, status: 1 });
paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ method: 1, status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
