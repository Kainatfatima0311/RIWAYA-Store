import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '@/lib/constants';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: 'include', // send cookies for JWT
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
