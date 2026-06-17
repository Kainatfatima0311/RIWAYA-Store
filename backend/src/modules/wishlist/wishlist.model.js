import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: 200 },
  },
  { _id: true }
);

const wishlistSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      unique: true,
      index: true,
    },
    items: [wishlistItemSchema],
  },
  { timestamps: true }
);

wishlistSchema.virtual('itemCount').get(function () {
  return this.items.length;
});

wishlistSchema.set('toJSON', { virtuals: true });
wishlistSchema.set('toObject', { virtuals: true });

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
