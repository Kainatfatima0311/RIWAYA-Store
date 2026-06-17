import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sub-folder by category if provided (e.g. /uploads/products, /uploads/equipment)
    const sub = req.params.category || req.query.category || 'general';
    const safeSub = sub.toString().replace(/[^a-z0-9-]/gi, '');
    const dir = path.join(UPLOADS_DIR, safeSub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${id}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /^image\/(jpeg|jpg|png|webp|gif)$/i;
  if (!allowed.test(file.mimetype)) {
    cb(new ApiError(400, 'Only JPG, PNG, WEBP and GIF images allowed'));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 10,
  },
});

// Single image
export const uploadSingleImage = upload.single('image');

// Multiple images (e.g. for product gallery)
export const uploadMultipleImages = upload.array('images', 10);

export const UPLOADS_PUBLIC_PATH = '/uploads';
export const UPLOADS_LOCAL_DIR = UPLOADS_DIR;
