import { ApiError } from '../utils/ApiError.js';

/**
 * Strip empty-string values from a flat object — for query strings, the frontend
 * may send `?category=&search=...` when filters are unset; treat those as undefined
 * so Zod's `.optional()` works naturally.
 */
const stripEmpty = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v === null) continue;
    out[k] = v;
  }
  return out;
};

/**
 * Validates req.body / req.query / req.params against a Zod schema.
 * Usage: router.post('/x', validate(schema, 'body'), controller)
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  // Query strings often arrive with empty-string values for unset filters.
  // Body and params should not be touched (form data may legitimately be '').
  const input = source === 'query' ? stripEmpty(req[source]) : req[source];
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  req[source] = result.data;
  next();
};
