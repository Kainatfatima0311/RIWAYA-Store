import mongoose from 'mongoose';

const slugify = (s) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const productCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      default: null,
      index: true,
    },

    // Materialized path for fast ancestor queries (e.g. "/bridal/embroidered/")
    path: { type: String, default: '/' },
    depth: { type: Number, default: 0 },

    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    icon: { type: String, trim: true, maxlength: 60 },
    color: { type: String, trim: true, maxlength: 20 },

    // Display controls
    displayOnFrontend: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },

    // SEO
    metaTitle: { type: String, trim: true, maxlength: 200 },
    metaDescription: { type: String, trim: true, maxlength: 500 },

    isActive: { type: Boolean, default: true, index: true },

    // Denormalized counts (kept fresh via service)
    productCount: { type: Number, default: 0, min: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productCategorySchema.index({ parent: 1, displayOrder: 1 });
productCategorySchema.index({ path: 1 });
productCategorySchema.index({ slug: 1 });
productCategorySchema.index({ name: 'text', description: 'text' });

// Ensure slug is generated and unique within siblings (same parent)
productCategorySchema.pre('validate', async function (next) {
  if (this.isModified('name') || !this.slug) {
    let base = slugify(this.name);
    let candidate = base;
    let n = 1;
    while (await mongoose.models.ProductCategory.findOne({ slug: candidate, _id: { $ne: this._id } })) {
      candidate = `${base}-${++n}`;
    }
    this.slug = candidate;
  }
  next();
});

export const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);
