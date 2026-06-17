import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateToken = (userId) =>
  jwt.sign({ id: userId }, env.jwt.secret, { expiresIn: env.jwt.expire });

export const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: env.jwt.cookieExpireDays * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
  });
};
