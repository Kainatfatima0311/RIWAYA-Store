import mongoose from 'mongoose';

const slugify = (s) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const rackCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: 80,
      // e.g. "Embroidery Suits", "Formal Wear", "Bridal", "Casual", "Lawn"
    },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    color: { type: String, trim: true, maxlength: 20 }, // optional UI tag (e.g. "#A569BD")
    icon: { type: String, trim: true, maxlength: 60 },  // optional icon name

    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

rackCategorySchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

rackCategorySchema.index({ name: 'text', description: 'text' });

export const RackCategory = mongoose.model('RackCategory', rackCategorySchema);
