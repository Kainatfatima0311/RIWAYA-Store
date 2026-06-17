import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import warehouseRoutes from '../modules/warehouse/warehouse.routes.js';
import floorRoutes from '../modules/warehouse/floor.routes.js';
import rackCategoryRoutes from '../modules/warehouse/rack-category.routes.js';
import rackRoutes from '../modules/warehouse/rack.routes.js';
import equipmentCategoryRoutes from '../modules/equipment/equipment-category.routes.js';
import equipmentRoutes from '../modules/equipment/equipment.routes.js';
import supplierRoutes from '../modules/supplier/supplier.routes.js';
import purchaseOrderRoutes from '../modules/purchase-order/purchase-order.routes.js';
import stockItemRoutes from '../modules/stock/stock-item.routes.js';
import stockMovementRoutes from '../modules/stock/stock-movement.routes.js';
import productCategoryRoutes from '../modules/product-category/product-category.routes.js';
import productRoutes from '../modules/product/product.routes.js';
import storefrontRoutes from '../modules/product/storefront.routes.js';
import customerRoutes from '../modules/customer/customer.routes.js';
import employeeRoutes from '../modules/employee/employee.routes.js';
import orderRoutes from '../modules/order/order.routes.js';
import orderStorefrontRoutes from '../modules/order/order-storefront.routes.js';
import paymentRoutes from '../modules/payment/payment.routes.js';
import financeRoutes from '../modules/finance/finance.routes.js';
import cartRoutes from '../modules/cart/cart.routes.js';
import wishlistRoutes from '../modules/wishlist/wishlist.routes.js';
import reportsRoutes from '../modules/reports/reports.routes.js';
import uploadRoutes from '../modules/upload/upload.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'RIWAYA API is healthy', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);

// ===== Warehouse module =====
router.use('/warehouses', warehouseRoutes);
router.use('/floors', floorRoutes);
router.use('/rack-categories', rackCategoryRoutes);
router.use('/racks', rackRoutes);

// ===== Equipment / Asset module =====
router.use('/equipment-categories', equipmentCategoryRoutes);
router.use('/equipment', equipmentRoutes);

// ===== Supplier + Purchase Order module =====
router.use('/suppliers', supplierRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);

// ===== Stock / Inventory module =====
router.use('/stock-items', stockItemRoutes);
router.use('/stock-movements', stockMovementRoutes);

// ===== Product + Category module (admin) =====
router.use('/product-categories', productCategoryRoutes);
router.use('/products', productRoutes);

// ===== Public storefront (no auth required) =====
router.use('/storefront', storefrontRoutes);

// ===== Customer + Employee modules =====
router.use('/customers', customerRoutes);
router.use('/employees', employeeRoutes);

// ===== Order + Payment + Finance modules =====
router.use('/orders', orderRoutes);
router.use('/storefront/orders', orderStorefrontRoutes);
router.use('/payments', paymentRoutes);
router.use('/finance', financeRoutes);

// ===== File uploads =====
router.use('/uploads', uploadRoutes);

// ===== Cart + Wishlist (customer self-service) =====
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);

// ===== Reports (admin dashboard composite endpoints) =====
router.use('/reports', reportsRoutes);

export default router;
