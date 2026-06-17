import { baseApi } from './baseApi';

export const warehouseApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Warehouses
    listWarehouses: b.query({
      query: (params = {}) => ({ url: '/warehouses', params }),
      providesTags: ['Warehouse'],
    }),
    getWarehouse: b.query({
      query: (id) => `/warehouses/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Warehouse', id }],
    }),
    warehouseSummary: b.query({
      query: (id) => `/warehouses/${id}/summary`,
      providesTags: (_r, _e, id) => [{ type: 'Warehouse', id }],
    }),
    createWarehouse: b.mutation({
      query: (body) => ({ url: '/warehouses', method: 'POST', body }),
      invalidatesTags: ['Warehouse'],
    }),
    updateWarehouse: b.mutation({
      query: ({ id, ...body }) => ({ url: `/warehouses/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Warehouse'],
    }),
    deleteWarehouse: b.mutation({
      query: (id) => ({ url: `/warehouses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Warehouse'],
    }),

    // Floors
    listFloors: b.query({
      query: (params = {}) => ({ url: '/floors', params }),
      providesTags: ['Floor'],
    }),
    createFloor: b.mutation({
      query: (body) => ({ url: '/floors', method: 'POST', body }),
      invalidatesTags: ['Floor', 'Warehouse'],
    }),
    updateFloor: b.mutation({
      query: ({ id, ...body }) => ({ url: `/floors/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Floor'],
    }),
    deleteFloor: b.mutation({
      query: (id) => ({ url: `/floors/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Floor', 'Warehouse'],
    }),

    // Rack categories
    listRackCategories: b.query({
      query: (params = {}) => ({ url: '/rack-categories', params }),
      providesTags: ['RackCategory'],
    }),
    createRackCategory: b.mutation({
      query: (body) => ({ url: '/rack-categories', method: 'POST', body }),
      invalidatesTags: ['RackCategory'],
    }),
    updateRackCategory: b.mutation({
      query: ({ id, ...body }) => ({ url: `/rack-categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['RackCategory'],
    }),
    deleteRackCategory: b.mutation({
      query: (id) => ({ url: `/rack-categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['RackCategory'],
    }),

    // Racks
    listRacks: b.query({
      query: (params = {}) => ({ url: '/racks', params }),
      providesTags: ['Rack'],
    }),
    createRack: b.mutation({
      query: (body) => ({ url: '/racks', method: 'POST', body }),
      invalidatesTags: ['Rack', 'Warehouse', 'Floor'],
    }),
    updateRack: b.mutation({
      query: ({ id, ...body }) => ({ url: `/racks/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Rack'],
    }),
    deleteRack: b.mutation({
      query: (id) => ({ url: `/racks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Rack', 'Warehouse', 'Floor'],
    }),
  }),
});

export const {
  useListWarehousesQuery,
  useGetWarehouseQuery,
  useWarehouseSummaryQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
  useListFloorsQuery,
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useDeleteFloorMutation,
  useListRackCategoriesQuery,
  useCreateRackCategoryMutation,
  useUpdateRackCategoryMutation,
  useDeleteRackCategoryMutation,
  useListRacksQuery,
  useCreateRackMutation,
  useUpdateRackMutation,
  useDeleteRackMutation,
} = warehouseApi;
