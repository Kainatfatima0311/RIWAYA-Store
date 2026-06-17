// Turn an RTK Query / fetchBaseQuery error into a human-readable message.
// The backend returns { success:false, message, details:[{ field, message }] }
// for Zod and Mongoose validation errors — surface those field-level details
// instead of the generic top-level "Validation failed".
export const apiErrorMessage = (err, fallback = 'Something went wrong') => {
  const data = err?.data;
  if (data && Array.isArray(data.details) && data.details.length) {
    return data.details.map((d) => `${d.field}: ${d.message}`).join(', ');
  }
  return data?.message || err?.error || fallback;
};
