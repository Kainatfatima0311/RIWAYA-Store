import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { uploadSingleImage, uploadMultipleImages, UPLOADS_LOCAL_DIR } from '../../middleware/upload.middleware.js';
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
    const category = (req.params.category || 'general').replace(/[^a-z0-9-]/gi, '');
    const url = `/uploads/${category}/${req.file.filename}`;
    created(res, {
      url,
      publicId: `${category}/${req.file.filename}`,
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
    const category = (req.params.category || 'general').replace(/[^a-z0-9-]/gi, '');
    const result = req.files.map((f) => ({
      url: `/uploads/${category}/${f.filename}`,
      publicId: `${category}/${f.filename}`,
      filename: f.filename,
      size: f.size,
      mimetype: f.mimetype,
    }));
    created(res, result, `${result.length} image(s) uploaded`);
  })
);

// Delete uploaded file by publicId (relative path inside /uploads)
router.delete(
  '/:publicId(*)',
  asyncHandler(async (req, res) => {
    const publicId = req.params.publicId;
    if (!publicId || publicId.includes('..')) throw ApiError.badRequest('Invalid id');
    const filePath = path.join(UPLOADS_LOCAL_DIR, publicId);
    if (!filePath.startsWith(UPLOADS_LOCAL_DIR)) throw ApiError.badRequest('Invalid path');
    if (!fs.existsSync(filePath)) throw ApiError.notFound('File not found');
    fs.unlinkSync(filePath);
    ok(res, null, 'Deleted');
  })
);

export default router;
