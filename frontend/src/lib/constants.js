export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'RIWAYA';
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CUSTOMER: 'customer',
});

export const isStaff = (role) => role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
