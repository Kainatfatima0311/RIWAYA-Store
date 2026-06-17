import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

// Upload to Cloudinary after Multer validates files in memory.
const storage = multer.memoryStorage();

const getUploadFolder = (req) => {
  const sub = (req.params.category || req.query.category || 'general')
    .toString()
    .replace(/[^a-z0-9-]/gi, '');
  return `riwaya/${sub || 'general'}`;
};

const uploadBufferToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(ApiError.internal('Cloudinary upload failed'));
          return;
        }
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

const attachCloudinaryFile = async (file, folder) => {
  const result = await uploadBufferToCloudinary(file, folder);
  delete file.buffer;

  return {
    ...file,
    path: result.secure_url,
    filename: result.public_id,
    size: result.bytes ?? file.size,
    cloudinary: result,
  };
};

const uploadSingleToCloudinary = async (req, _res, next) => {
  try {
    if (req.file) {
      req.file = await attachCloudinaryFile(req.file, getUploadFolder(req));
    }
    next();
  } catch (error) {
    next(error);
  }
};

const uploadMultipleToCloudinary = async (req, _res, next) => {
  try {
    if (Array.isArray(req.files) && req.files.length) {
      const folder = getUploadFolder(req);
      req.files = await Promise.all(req.files.map((file) => attachCloudinaryFile(file, folder)));
    }
    next();
  } catch (error) {
    next(error);
  }
};

const fileFilter = (_req, file, cb) => {
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

// Single image.
export const uploadSingleImage = [upload.single('image'), uploadSingleToCloudinary];

// Multiple images, for example a product gallery.
export const uploadMultipleImages = [upload.array('images', 10), uploadMultipleToCloudinary];

// Re-exported so the upload routes can delete assets by public_id.
export { cloudinary };
