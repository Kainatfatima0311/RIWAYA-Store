import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required = ['MONGO_URI', 'JWT_SECRET'];
// Cloudinary stores all uploads in production (Vercel has no writable disk), so
// require its keys there. Locally they can stay empty unless you test uploads.
if (process.env.NODE_ENV === 'production') {
  required.push('CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET');
}
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  // Throw instead of process.exit(1): on Vercel this surfaces at cold start
  // where the serverless entry (api/index.js) catches it and returns a clean
  // 500 with the message logged, rather than an opaque FUNCTION_INVOCATION_FAILED.
  // Locally and in CLI seed scripts this still fails fast with a clear message.
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGO_URI,

  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '7d',
    cookieExpireDays: parseInt(process.env.JWT_COOKIE_EXPIRE || '7', 10),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  seed: {
    superAdminName: process.env.SUPER_ADMIN_NAME || 'RIWAYA Super Admin',
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'superadmin@riwaya.com',
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || 'Super@1234',
  },
};
