import { baseApi } from './baseApi';

export const orderApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Storefront / customer
    placeOrder: b.mutation({
      query: (body) => ({ url: '/storefront/orders', method: 'POST', body }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    myOrders: b.query({
      query: (params = {}) => ({ url: '/storefront/orders/me', params }),
      providesTags: ['Order'],
    }),
    myOrder: b.query({
      query: (id) => `/storefront/orders/me/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    trackOrder: b.query({
      query: (orderNumber) => `/storefront/orders/track/${orderNumber}`,
    }),

    // Admin
    listOrders: b.query({
      query: (params = {}) => ({ url: '/orders', params }),
      providesTags: ['Order'],
    }),
    getOrder: b.query({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    createPhysicalOrder: b.mutation({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Order', 'StockItem'],
    }),
    transitionOrder: b.mutation({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/transition`, method: 'POST', body }),
      invalidatesTags: ['Order', 'StockItem'],
    }),
    cancelOrder: b.mutation({
      query: ({ id, reason }) => ({ url: `/orders/${id}/cancel`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Order', 'StockItem'],
    }),
    updateCourier: b.mutation({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/courier`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Order', id }],
    }),
    orderStats: b.query({
      query: (params = {}) => ({ url: '/orders/stats', params }),
      providesTags: ['Order'],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useMyOrdersQuery,
  useMyOrderQuery,
  useTrackOrderQuery,
  useListOrdersQuery,
  useGetOrderQuery,
  useCreatePhysicalOrderMutation,
  useTransitionOrderMutation,
  useCancelOrderMutation,
  useUpdateCourierMutation,
  useOrderStatsQuery,
} = orderApi;
