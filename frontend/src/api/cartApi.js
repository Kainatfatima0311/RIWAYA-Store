import { baseApi } from './baseApi';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCart: b.query({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),
    addToCart: b.mutation({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: b.mutation({
      query: ({ itemId, quantity }) => ({
        url: `/cart/items/${itemId}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: b.mutation({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: b.mutation({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    applyCoupon: b.mutation({
      query: (body) => ({ url: '/cart/coupon', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    removeCoupon: b.mutation({
      query: () => ({ url: '/cart/coupon', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
} = cartApi;
