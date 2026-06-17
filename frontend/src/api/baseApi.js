import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '@/lib/constants';

export const baseApi = createApi({
  reducerPath: 'api',
  // Re-fetch list/detail data whenever a screen re-mounts, so dropdowns and
  // tables always reflect the latest server state (new categories, suppliers,
  // warehouses, etc.) even if a tag invalidation was missed.
  refetchOnMountOrArgChange: true,
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: 'include', // send cookies for JWT
    // Drop empty/blank query params so optional filters like status='' or
    // method='' are simply omitted. The backend validates these as optional
    // zod enums, which reject '' (only `undefined` is allowed) — sending ''
    // would 400 the entire list request and silently empty the table
    // (this is exactly why the Payments list showed "No records found").
    paramsSerializer: (params) => {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(params || {})) {
        if (value !== undefined && value !== null && value !== '') {
          sp.append(key, value);
        }
      }
      return sp.toString();
    },
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('riwaya_token');
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    'Me',
    'Warehouse',
    'Floor',
    'Rack',
    'RackCategory',
    'Equipment',
    'EquipmentCategory',
    'Supplier',
    'PurchaseOrder',
    'StockItem',
    'StockMovement',
    'Product',
    'ProductCategory',
    'Customer',
    'Employee',
    'Attendance',
    'Order',
    'Payment',
    'Finance',
    'Cart',
    'Wishlist',
    'Report',
  ],
  endpoints: () => ({}),
});
