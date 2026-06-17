import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateToken = (userId) =>
  jwt.sign({ id: userId }, env.jwt.secret, { expiresIn: env.jwt.expire });

// Cross-site cookies: when the frontend and API live on different domains
// (separate *.vercel.app projects), the browser only sends a credentialed
// cookie if it is SameSite=None AND Secure. Locally we stay on 'lax' so the
// cookie works over http://localhost. (Auth also falls back to the Bearer
// token in localStorage, so cookies are belt-and-suspenders.)
const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
});

export const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    ...cookieOptions(),
    maxAge: env.jwt.cookieExpireDays * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookie = (res) => {
  res.clearCookie('token', cookieOptions());
};
