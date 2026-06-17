import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true }, // refs Product.variants subdoc
    quantity: { type: Number, required: true, min: 1, max: 100 },
    priceSnapshot: { type: Number, min: 0 }, // captured at add-time for fast totals
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    couponCode: { type: String, trim: true, maxlength: 40 },
  },
  { timestamps: true }
);

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((s, it) => s + it.quantity, 0);
});

cartSchema.virtual('subtotal').get(function () {
  return +this.items.reduce((s, it) => s + (it.priceSnapshot || 0) * it.quantity, 0).toFixed(2);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

export const Cart = mongoose.model('Cart', cartSchema);
