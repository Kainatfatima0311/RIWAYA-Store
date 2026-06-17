import mongoose from 'mongoose';

const slugify = (s) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const equipmentCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: 80,
      // e.g. "Electronics", "Furniture", "Appliances", "Stationery",
      //      "Cleaning", "Safety", "Networking", "Lighting"
    },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    icon: { type: String, trim: true, maxlength: 60 },
    color: { type: String, trim: true, maxlength: 20 },

    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

equipmentCategorySchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

equipmentCategorySchema.index({ name: 'text', description: 'text' });

export const EquipmentCategory = mongoose.model('EquipmentCategory', equipmentCategorySchema);
