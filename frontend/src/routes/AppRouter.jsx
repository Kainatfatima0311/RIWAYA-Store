import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import AdminLayout from '@/layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { StaffRoute } from './StaffRoute';

// Home is the landing page — keep it eager so first paint is instant.
import Home from '@/pages/storefront/Home';

// Everything else is code-split (React.lazy). The two layouts render the lazy
// element inside a <Suspense> boundary, so the nav/chrome stays visible while
// the route chunk loads. This keeps heavy admin-only deps (recharts, jspdf,
// html2canvas) out of the initial storefront bundle entirely.

// Storefront (secondary pages)
const Login = lazy(() => import('@/pages/storefront/Login'));
const Register = lazy(() => import('@/pages/storefront/Register'));
const About = lazy(() => import('@/pages/storefront/About'));
const Contact = lazy(() => import('@/pages/storefront/Contact'));
const Products = lazy(() => import('@/pages/storefront/Products'));
const ProductDetail = lazy(() => import('@/pages/storefront/ProductDetail'));
const Cart = lazy(() => import('@/pages/storefront/Cart'));
const Wishlist = lazy(() => import('@/pages/storefront/Wishlist'));
const Checkout = lazy(() => import('@/pages/storefront/Checkout'));
const Profile = lazy(() => import('@/pages/storefront/Profile'));
const MyOrders = lazy(() => import('@/pages/storefront/MyOrders'));
const OrderTracking = lazy(() => import('@/pages/storefront/OrderTracking'));

// Admin (entire section is lazy — not needed by storefront visitors)
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminWarehouses = lazy(() => import('@/pages/admin/Warehouses'));
const AdminProducts = lazy(() => import('@/pages/admin/Products'));
const AdminCategories = lazy(() => import('@/pages/admin/Categories'));
const AdminStock = lazy(() => import('@/pages/admin/Stock'));
const AdminStockMovements = lazy(() => import('@/pages/admin/StockMovements'));
const AdminEquipment = lazy(() => import('@/pages/admin/Equipment'));
const AdminSuppliers = lazy(() => import('@/pages/admin/Suppliers'));
const AdminPurchaseOrders = lazy(() => import('@/pages/admin/PurchaseOrders'));
const AdminOrders = lazy(() => import('@/pages/admin/Orders'));
const AdminPayments = lazy(() => import('@/pages/admin/Payments'));
const AdminCustomers = lazy(() => import('@/pages/admin/Customers'));
const AdminEmployees = lazy(() => import('@/pages/admin/Employees'));
const AdminFinance = lazy(() => import('@/pages/admin/Finance'));
const AdminReports = lazy(() => import('@/pages/admin/Reports'));
const AdminOrderDetail = lazy(() => import('@/pages/admin/OrderDetail'));
const AdminPODetail = lazy(() => import('@/pages/admin/PODetail'));
const AdminGuide = lazy(() => import('@/pages/admin/Guide'));
const AdminRackCategories = lazy(() => import('@/pages/admin/RackCategories'));

export function AppRouter() {
  return (
    <Routes>
      {/* Storefront */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/track" element={<OrderTracking />} />
        <Route path="/track/:orderNumber" element={<OrderTracking />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<StaffRoute><AdminLayout /></StaffRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="guide" element={<AdminGuide />} />
        <Route path="warehouses" element={<AdminWarehouses />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="product-categories" element={<AdminCategories />} />
        <Route path="stock" element={<AdminStock />} />
        <Route path="stock-movements" element={<AdminStockMovements />} />
        <Route path="rack-categories" element={<AdminRackCategories />} />
        <Route path="equipment" element={<AdminEquipment />} />
        <Route path="suppliers" element={<AdminSuppliers />} />
        <Route path="purchase-orders" element={<AdminPurchaseOrders />} />
        <Route path="purchase-orders/:id" element={<AdminPODetail />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="finance" element={<AdminFinance />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
