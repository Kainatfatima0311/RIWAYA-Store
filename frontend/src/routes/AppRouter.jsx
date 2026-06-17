import { Routes, Route, Navigate } from 'react-router-dom';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import AdminLayout from '@/layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { StaffRoute } from './StaffRoute';

// Public storefront pages
import Home from '@/pages/storefront/Home';
import Login from '@/pages/storefront/Login';
import Register from '@/pages/storefront/Register';
import About from '@/pages/storefront/About';
import Products from '@/pages/storefront/Products';
import ProductDetail from '@/pages/storefront/ProductDetail';
import Cart from '@/pages/storefront/Cart';
import Wishlist from '@/pages/storefront/Wishlist';
import Checkout from '@/pages/storefront/Checkout';
import Profile from '@/pages/storefront/Profile';
import MyOrders from '@/pages/storefront/MyOrders';
import OrderTracking from '@/pages/storefront/OrderTracking';

// Admin pages
import Dashboard from '@/pages/admin/Dashboard';
import AdminWarehouses from '@/pages/admin/Warehouses';
import AdminProducts from '@/pages/admin/Products';
import AdminCategories from '@/pages/admin/Categories';
import AdminStock from '@/pages/admin/Stock';
import AdminStockMovements from '@/pages/admin/StockMovements';
import AdminEquipment from '@/pages/admin/Equipment';
import AdminSuppliers from '@/pages/admin/Suppliers';
import AdminPurchaseOrders from '@/pages/admin/PurchaseOrders';
import AdminOrders from '@/pages/admin/Orders';
import AdminPayments from '@/pages/admin/Payments';
import AdminCustomers from '@/pages/admin/Customers';
import AdminEmployees from '@/pages/admin/Employees';
import AdminFinance from '@/pages/admin/Finance';
import AdminReports from '@/pages/admin/Reports';
import AdminOrderDetail from '@/pages/admin/OrderDetail';
import AdminPODetail from '@/pages/admin/PODetail';

export function AppRouter() {
  return (
    <Routes>
      {/* Storefront */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
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
        <Route path="warehouses" element={<AdminWarehouses />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="product-categories" element={<AdminCategories />} />
        <Route path="stock" element={<AdminStock />} />
        <Route path="stock-movements" element={<AdminStockMovements />} />
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
