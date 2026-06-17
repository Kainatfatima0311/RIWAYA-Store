import { Router } from 'express';
import { uploadSingleImage, uploadMultipleImages, cloudinary } from '../../middleware/upload.middleware.js';
import { protect } from '../../middleware/auth.middleware.js';
import { isStaff } from '../../middleware/role.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';

const router = Router();
router.use(protect, isStaff);

// Single image upload — returns { url, publicId, filename, size }
router.post(
  '/image/:category?',
  uploadSingleImage,
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('No image file provided. Use field name "image".');
    created(res, {
      url: req.file.path,        // Cloudinary secure URL
      publicId: req.file.filename, // Cloudinary public_id (e.g. riwaya/products/abc123)
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'Image uploaded');
  })
);

// Multiple images upload — returns array of { url, publicId, filename, size }
router.post(
  '/images/:category?',
  uploadMultipleImages,
  asyncHandler(async (req, res) => {
    if (!req.files?.length) throw ApiError.badRequest('No images provided. Use field name "images".');
    const result = req.files.map((f) => ({
      url: f.path,
      publicId: f.filename,
      filename: f.filename,
      size: f.size,
      mimetype: f.mimetype,
    }));
    created(res, result, `${result.length} image(s) uploaded`);
  })
);

// Delete uploaded file by publicId (Cloudinary public_id)
router.delete(
  '/:publicId(*)',
  asyncHandler(async (req, res) => {
    const publicId = req.params.publicId;
    if (!publicId || publicId.includes('..')) throw ApiError.badRequest('Invalid id');
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw ApiError.badRequest(`Delete failed: ${result.result}`);
    }
    ok(res, null, 'Deleted');
  })
);

export default router;
