import { baseApi } from './baseApi';

export const productApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ===== Storefront (public) =====
    storefrontCategories: b.query({
      // onlyFrontend=true so the admin "Show on storefront" toggle actually
      // controls what appears in "Shop by Category" on the home page.
      query: () => ({ url: '/storefront/categories', params: { onlyFrontend: true } }),
      providesTags: ['ProductCategory'],
    }),
    storefrontCategoryBySlug: b.query({
      query: (slug) => `/storefront/categories/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'ProductCategory', id: slug }],
    }),
    storefrontProducts: b.query({
      query: (params = {}) => ({ url: '/storefront/products', params }),
      providesTags: ['Product'],
    }),
    storefrontFeatured: b.query({
      query: (limit = 8) => ({ url: '/storefront/products/featured', params: { limit } }),
      providesTags: ['Product'],
    }),
    storefrontProductBySlug: b.query({
      query: (slug) => `/storefront/products/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: 'Product', id: slug }],
    }),

    // ===== Admin =====
    listProducts: b.query({
      query: (params = {}) => ({ url: '/products', params }),
      providesTags: ['Product'],
    }),
    getProduct: b.query({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),
    createProduct: b.mutation({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product', 'ProductCategory'],
    }),
    updateProduct: b.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: b.mutation({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product', 'ProductCategory'],
    }),
    toggleProductDisplay: b.mutation({
      query: ({ id, displayOnFrontend }) => ({
        url: `/products/${id}/display`,
        method: 'PATCH',
        body: { displayOnFrontend },
      }),
      invalidatesTags: ['Product'],
    }),
    setProductStatus: b.mutation({
      query: ({ id, status }) => ({ url: `/products/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Product', 'ProductCategory'],
    }),

    // ===== Product Categories (admin) =====
    listProductCategories: b.query({
      query: (params = {}) => ({ url: '/product-categories', params }),
      providesTags: ['ProductCategory'],
    }),
    productCategoryTree: b.query({
      query: () => '/product-categories/tree',
      providesTags: ['ProductCategory'],
    }),
    createProductCategory: b.mutation({
      query: (body) => ({ url: '/product-categories', method: 'POST', body }),
      invalidatesTags: ['ProductCategory'],
    }),
    updateProductCategory: b.mutation({
      query: ({ id, ...body }) => ({ url: `/product-categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['ProductCategory'],
    }),
    deleteProductCategory: b.mutation({
      query: (id) => ({ url: `/product-categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ProductCategory'],
    }),
  }),
});

export const {
  useStorefrontCategoriesQuery,
  useStorefrontCategoryBySlugQuery,
  useStorefrontProductsQuery,
  useStorefrontFeaturedQuery,
  useStorefrontProductBySlugQuery,
  useListProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleProductDisplayMutation,
  useSetProductStatusMutation,
  useListProductCategoriesQuery,
  useProductCategoryTreeQuery,
  useCreateProductCategoryMutation,
  useUpdateProductCategoryMutation,
  useDeleteProductCategoryMutation,
} = productApi;
