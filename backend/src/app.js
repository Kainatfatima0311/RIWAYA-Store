import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

export const createApp = () => {
  const app = express();

  // Behind Vercel's proxy — trust the first hop so secure cookies, req.ip and
  // express-rate-limit (which reads X-Forwarded-For) behave correctly. Using a
  // numeric hop count (not `true`) avoids rate-limit's permissive-proxy error.
  app.set('trust proxy', 1);

  // Security — helmet with crossOriginResourcePolicy adjusted so storefront/admin can load uploaded images
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(mongoSanitize());

  // CORS — accept one or more comma-separated origins from CLIENT_URL, and
  // ignore trailing slashes so a stray "/" in the env var can't silently break
  // CORS (a common deploy footgun). Requests with no Origin header (curl,
  // health checks, server-to-server) are allowed through.
  const allowedOrigins = (env.clientUrl || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
          return cb(null, true);
        }
        return cb(null, false);
      },
      credentials: true,
    })
  );

  // Body & cookie parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Logging
  if (!env.isProd) app.use(morgan('dev'));

  // Rate limiting (apply only to /api)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // Root
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'RIWAYA API',
      version: '1.0.0',
      docs: '/api/health',
    });
  });

  // API routes
  app.use('/api', apiRouter);

  // 404 + error handlers (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
