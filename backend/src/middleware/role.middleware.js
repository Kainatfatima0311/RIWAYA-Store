import { ApiError } from '../utils/ApiError.js';

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CUSTOMER: 'customer',
});

export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Role '${req.user.role}' is not authorized for this resource`));
  }
  next();
};

export const isStaff = authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN);
export const isSuperAdmin = authorize(ROLES.SUPER_ADMIN);
export const isCustomer = authorize(ROLES.CUSTOMER);
