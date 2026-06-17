// Escape special regex characters in user-supplied input so it can be safely
// used inside `new RegExp(...)` for case-insensitive "contains" searches.
// Prevents regex injection and ReDoS from untrusted search/filter params.
export const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
