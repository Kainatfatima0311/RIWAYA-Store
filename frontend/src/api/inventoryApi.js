import { baseApi } from './baseApi';

// Combined: stock items + movements + equipment + suppliers + POs
export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ===== Stock items =====
    listStockItems: b.query({
      query: (params = {}) => ({ url: '/stock-items', params }),
      providesTags: ['StockItem'],
    }),
    getStockItem: b.query({
      query: (id) => `/stock-items/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'StockItem', id }],
    }),
    createStockItem: b.mutation({
      query: (body) => ({ url: '/stock-items', method: 'POST', body }),
      invalidatesTags: ['StockItem'],
    }),
    updateStockItem: b.mutation({
      query: ({ id, ...body }) => ({ url: `/stock-items/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['StockItem'],
    }),
    deleteStockItem: b.mutation({
      query: (id) => ({ url: `/stock-items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['StockItem'],
    }),
    lowStock: b.query({
      query: (params = {}) => ({ url: '/stock-items/low-stock', params }),
      providesTags: ['StockItem'],
    }),
    stockItemEntries: b.query({
      query: (id) => `/stock-items/${id}/entries`,
      providesTags: (_r, _e, id) => [{ type: 'StockItem', id }],
    }),
    stockItemMovements: b.query({
      query: ({ id, ...params }) => ({ url: `/stock-items/${id}/movements`, params }),
      providesTags: ['StockMovement'],
    }),
    receiveStock: b.mutation({
      query: ({ id, ...body }) => ({ url: `/stock-items/${id}/receive`, method: 'POST', body }),
      invalidatesTags: ['StockItem', 'StockMovement', 'Rack'],
    }),
    transferStock: b.mutation({
      query: ({ id, ...body }) => ({ url: `/stock-items/${id}/transfer`, method: 'POST', body }),
      invalidatesTags: ['StockItem', 'StockMovement', 'Rack'],
    }),
    adjustStock: b.mutation({
      query: ({ id, ...body }) => ({ url: `/stock-items/${id}/adjust`, method: 'POST', body }),
      invalidatesTags: ['StockItem', 'StockMovement', 'Rack'],
    }),
    writeOffStock: b.mutation({
      query: ({ id, ...body }) => ({ url: `/stock-items/${id}/write-off`, method: 'POST', body }),
      invalidatesTags: ['StockItem', 'StockMovement', 'Rack'],
    }),

    // Global movements feed
    listStockMovements: b.query({
      query: (params = {}) => ({ url: '/stock-movements', params }),
      providesTags: ['StockMovement'],
    }),

    // ===== Equipment =====
    listEquipment: b.query({
      query: (params = {}) => ({ url: '/equipment', params }),
      providesTags: ['Equipment'],
    }),
    getEquipment: b.query({
      query: (id) => `/equipment/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Equipment', id }],
    }),
    createEquipment: b.mutation({
      query: (body) => ({ url: '/equipment', method: 'POST', body }),
      invalidatesTags: ['Equipment'],
    }),
    updateEquipment: b.mutation({
      query: ({ id, ...body }) => ({ url: `/equipment/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Equipment'],
    }),
    deleteEquipment: b.mutation({
      query: (id) => ({ url: `/equipment/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Equipment'],
    }),
    equipmentSpendSummary: b.query({
      query: (params = {}) => ({ url: '/equipment/spend-summary', params }),
      providesTags: ['Equipment'],
    }),
    assignEquipment: b.mutation({
      query: ({ id, assignedTo }) => ({ url: `/equipment/${id}/assign`, method: 'POST', body: { assignedTo } }),
      invalidatesTags: ['Equipment'],
    }),

    // Equipment categories
    listEquipmentCategories: b.query({
      query: (params = {}) => ({ url: '/equipment-categories', params }),
      providesTags: ['EquipmentCategory'],
    }),
    createEquipmentCategory: b.mutation({
      query: (body) => ({ url: '/equipment-categories', method: 'POST', body }),
      invalidatesTags: ['EquipmentCategory'],
    }),
    updateEquipmentCategory: b.mutation({
      query: ({ id, ...body }) => ({ url: `/equipment-categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['EquipmentCategory'],
    }),
    deleteEquipmentCategory: b.mutation({
      query: (id) => ({ url: `/equipment-categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['EquipmentCategory'],
    }),

    // ===== Suppliers =====
    listSuppliers: b.query({
      query: (params = {}) => ({ url: '/suppliers', params }),
      providesTags: ['Supplier'],
    }),
    getSupplier: b.query({
      query: (id) => `/suppliers/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Supplier', id }],
    }),
    createSupplier: b.mutation({
      query: (body) => ({ url: '/suppliers', method: 'POST', body }),
      invalidatesTags: ['Supplier'],
    }),
    updateSupplier: b.mutation({
      query: ({ id, ...body }) => ({ url: `/suppliers/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Supplier'],
    }),
    deleteSupplier: b.mutation({
      query: (id) => ({ url: `/suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Supplier'],
    }),

    // ===== Purchase Orders =====
    listPOs: b.query({
      query: (params = {}) => ({ url: '/purchase-orders', params }),
      providesTags: ['PurchaseOrder'],
    }),
    getPO: b.query({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PurchaseOrder', id }],
    }),
    createPO: b.mutation({
      query: (body) => ({ url: '/purchase-orders', method: 'POST', body }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    updatePO: b.mutation({
      query: ({ id, ...body }) => ({ url: `/purchase-orders/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    deletePO: b.mutation({
      query: (id) => ({ url: `/purchase-orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    approvePO: b.mutation({
      query: (id) => ({ url: `/purchase-orders/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['PurchaseOrder', 'Supplier'],
    }),
    cancelPO: b.mutation({
      query: ({ id, reason }) => ({ url: `/purchase-orders/${id}/cancel`, method: 'POST', body: { reason } }),
      invalidatesTags: ['PurchaseOrder', 'Supplier'],
    }),
    addPOReceipt: b.mutation({
      query: ({ id, ...body }) => ({ url: `/purchase-orders/${id}/receipts`, method: 'POST', body }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    addPOPayment: b.mutation({
      query: ({ id, ...body }) => ({ url: `/purchase-orders/${id}/payments`, method: 'POST', body }),
      invalidatesTags: ['PurchaseOrder', 'Supplier'],
    }),
    poStats: b.query({
      query: (params = {}) => ({ url: '/purchase-orders/stats', params }),
      providesTags: ['PurchaseOrder'],
    }),
  }),
});

export const {
  useListStockItemsQuery,
  useGetStockItemQuery,
  useCreateStockItemMutation,
  useUpdateStockItemMutation,
  useDeleteStockItemMutation,
  useLowStockQuery,
  useStockItemEntriesQuery,
  useStockItemMovementsQuery,
  useReceiveStockMutation,
  useTransferStockMutation,
  useAdjustStockMutation,
  useWriteOffStockMutation,
  useListStockMovementsQuery,
  useListEquipmentQuery,
  useGetEquipmentQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
  useEquipmentSpendSummaryQuery,
  useAssignEquipmentMutation,
  useListEquipmentCategoriesQuery,
  useCreateEquipmentCategoryMutation,
  useUpdateEquipmentCategoryMutation,
  useDeleteEquipmentCategoryMutation,
  useListSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useListPOsQuery,
  useGetPOQuery,
  useCreatePOMutation,
  useUpdatePOMutation,
  useDeletePOMutation,
  useApprovePOMutation,
  useCancelPOMutation,
  useAddPOReceiptMutation,
  useAddPOPaymentMutation,
  usePoStatsQuery,
} = inventoryApi;
