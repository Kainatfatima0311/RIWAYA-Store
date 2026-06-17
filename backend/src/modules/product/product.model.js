import mongoose from 'mongoose';

const slugify = (s) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export const PRODUCT_STATUS = Object.freeze(['draft', 'published', 'archived']);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    alt: { type: String, trim: true, maxlength: 200 },
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 120 }, // e.g. "Red - Large"
    stockItem: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true },
    additionalPrice: { type: Number, default: 0 }, // delta from product.basePrice
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, lowercase: true, trim: true },

    shortDescription: { type: String, trim: true, maxlength: 500 },
    description: { type: String, trim: true, maxlength: 10000 },

    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', index: true }],

    brand: { type: String, trim: true, maxlength: 100 },
    sku: { type: String, trim: true, maxlength: 80, index: true }, // product-level SKU (parent)

    // Pricing
    basePrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },                // optional discount price
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    currency: { type: String, default: 'PKR', trim: true, maxlength: 8 },

    // Inventory link — at least one variant required
    variants: { type: [variantSchema], validate: (v) => v.length > 0 },

    // Media
    images: [imageSchema],
    video: { type: String, trim: true }, // optional video URL

    // Display controls
    displayOnFrontend: { type: Boolean, default: false, index: true }, // user requirement
    displayOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    isNew: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },

    status: { type: String, enum: PRODUCT_STATUS, default: 'draft', index: true },

    // SEO
    metaTitle: { type: String, trim: true, maxlength: 200 },
    metaDescription: { type: String, trim: true, maxlength: 500 },
    keywords: [{ type: String, trim: true, maxlength: 40 }],

    // Specifications (flexible key/value)
    specifications: [
      {
        label: { type: String, trim: true, maxlength: 80 },
        value: { type: String, trim: true, maxlength: 300 },
      },
    ],

    tags: [{ type: String, trim: true, maxlength: 40 }],

    // Stats (denormalized)
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    totalSold: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },

    publishedAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', shortDescription: 'text', description: 'text', tags: 'text' });
productSchema.index({ status: 1, displayOnFrontend: 1, displayOrder: 1 });
productSchema.index({ categories: 1, displayOnFrontend: 1 });
productSchema.index({ isFeatured: 1, displayOnFrontend: 1 });

// Auto-slug
productSchema.pre('validate', async function (next) {
  if (this.isModified('name') || !this.slug) {
    let base = slugify(this.name);
    let candidate = base;
    let n = 1;
    while (
      await mongoose.models.Product.findOne({ slug: candidate, _id: { $ne: this._id } })
    ) {
      candidate = `${base}-${++n}`;
    }
    this.slug = candidate;
  }

  // Auto-set publishedAt on first transition to published
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Ensure exactly one default variant if any exist
  if (this.variants?.length) {
    const hasDefault = this.variants.some((v) => v.isDefault);
    if (!hasDefault) this.variants[0].isDefault = true;
  }
  next();
});

// Effective price helpers
productSchema.virtual('effectivePrice').get(function () {
  return this.salePrice > 0 && this.salePrice < this.basePrice ? this.salePrice : this.basePrice;
});

productSchema.virtual('isOnSale').get(function () {
  return this.salePrice > 0 && this.salePrice < this.basePrice;
});

productSchema.virtual('discountPercent').get(function () {
  if (!this.isOnSale) return 0;
  return Math.round(((this.basePrice - this.salePrice) / this.basePrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const Product = mongoose.model('Product', productSchema);
