import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../modules/user/user.model.js';

const extractToken = (req) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.cookies?.token) return req.cookies.token;
  return null;
};

export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Not authorized, no token provided');

  const decoded = jwt.verify(token, env.jwt.secret);
  const user = await User.findById(decoded.id);

  if (!user) throw ApiError.unauthorized('User belonging to this token no longer exists');
  if (!user.isActive) throw ApiError.forbidden('Account has been deactivated');

  req.user = user;
  next();
});

// Optional auth: attach user if token present, otherwise continue as guest
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await User.findById(decoded.id);
    if (user?.isActive) req.user = user;
  } catch {
    // ignore — proceed as guest
  }
  next();
});
