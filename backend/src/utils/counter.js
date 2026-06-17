import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // counter name, e.g. "po", "supplier", "order"
    sequence: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Atomically increment a named counter and return the new value.
 * Example: const n = await nextSequence('po');  // 1, 2, 3, ...
 */
export const nextSequence = async (name) => {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return doc.sequence;
};

/**
 * Format helper: produces "PREFIX-YYYY-NNNN" given a counter name.
 */
export const formatSequence = async (name, prefix, pad = 4) => {
  const n = await nextSequence(name);
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(n).padStart(pad, '0')}`;
};

/**
 * Format helper without year: "PREFIX-NNNN"
 */
export const formatSequenceNoYear = async (name, prefix, pad = 4) => {
  const n = await nextSequence(name);
  return `${prefix}-${String(n).padStart(pad, '0')}`;
};
