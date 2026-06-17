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
import { UPLOADS_LOCAL_DIR } from './middleware/upload.middleware.js';

export const createApp = () => {
  const app = express();

  // Security — helmet with crossOriginResourcePolicy adjusted so storefront/admin can load uploaded images
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(mongoSanitize());

  // CORS
  app.use(
    cors({
      origin: env.clientUrl,
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

  // Serve uploaded files (publicly readable)
  app.use('/uploads', express.static(UPLOADS_LOCAL_DIR, { maxAge: '7d' }));

  // API routes
  app.use('/api', apiRouter);

  // 404 + error handlers (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
