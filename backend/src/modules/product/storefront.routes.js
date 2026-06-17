import { Router } from 'express';
import { productController } from './product.controller.js';
import { productCategoryController } from '../product-category/product-category.controller.js';
import {
  listProductQuerySchema,
  productSlugSchema,
} from './product.validator.js';
import { productCategorySlugSchema } from '../product-category/product-category.validator.js';
import { validate } from '../../middleware/validate.middleware.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Public read endpoints — optionalAuth lets us personalise later if logged in
router.use(optionalAuth);

// Categories
router.get('/categories', productCategoryController.tree);
router.get('/categories/:slug', validate(productCategorySlugSchema, 'params'), productCategoryController.getBySlug);

// Products
router.get('/products', validate(listProductQuerySchema, 'query'), productController.storefrontList);
router.get('/products/featured', productController.storefrontFeatured);
router.get('/products/:slug', validate(productSlugSchema, 'params'), productController.storefrontGet);

export default router;
