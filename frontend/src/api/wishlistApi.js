import { baseApi } from './baseApi';

export const wishlistApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getWishlist: b.query({
      query: () => '/wishlist',
      providesTags: ['Wishlist'],
    }),
    addToWishlist: b.mutation({
      query: (body) => ({ url: '/wishlist/items', method: 'POST', body }),
      invalidatesTags: ['Wishlist'],
      // Optimistic: pop the navbar wishlist count immediately; refetch reconciles.
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          wishlistApi.util.updateQueryData('getWishlist', undefined, (draft) => {
            if (draft?.data) draft.data.itemCount = (draft.data.itemCount || 0) + 1;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    removeWishlistItem: b.mutation({
      query: (itemId) => ({ url: `/wishlist/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['Wishlist'],
    }),
    removeWishlistByProduct: b.mutation({
      query: (productId) => ({ url: `/wishlist/products/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Wishlist'],
    }),
    clearWishlist: b.mutation({
      query: () => ({ url: '/wishlist', method: 'DELETE' }),
      invalidatesTags: ['Wishlist'],
    }),
    checkInWishlist: b.query({
      query: (productId) => `/wishlist/check/${productId}`,
      providesTags: ['Wishlist'],
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveWishlistItemMutation,
  useRemoveWishlistByProductMutation,
  useClearWishlistMutation,
  useCheckInWishlistQuery,
} = wishlistApi;
