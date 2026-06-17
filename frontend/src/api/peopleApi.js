import { baseApi } from './baseApi';

// Combined: customers + employees + payments + finance + reports
export const peopleApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ===== Customers =====
    listCustomers: b.query({
      query: (params = {}) => ({ url: '/customers', params }),
      providesTags: ['Customer'],
    }),
    getCustomer: b.query({
      query: (id) => `/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: b.mutation({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: b.mutation({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: b.mutation({
      query: (id) => ({ url: `/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),
    myCustomerProfile: b.query({
      query: () => '/customers/me',
      providesTags: ['Customer'],
    }),
    updateMyCustomerProfile: b.mutation({
      query: (body) => ({ url: '/customers/me', method: 'PATCH', body }),
      invalidatesTags: ['Customer'],
    }),
    addMyAddress: b.mutation({
      query: (body) => ({ url: '/customers/me/addresses', method: 'POST', body }),
      invalidatesTags: ['Customer'],
    }),
    updateMyAddress: b.mutation({
      query: ({ addressId, ...body }) => ({
        url: `/customers/me/addresses/${addressId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Customer'],
    }),
    removeMyAddress: b.mutation({
      query: (addressId) => ({ url: `/customers/me/addresses/${addressId}`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),

    // ===== Employees =====
    listEmployees: b.query({
      query: (params = {}) => ({ url: '/employees', params }),
      providesTags: ['Employee'],
    }),
    getEmployee: b.query({
      query: (id) => `/employees/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }],
    }),
    createEmployee: b.mutation({
      query: (body) => ({ url: '/employees', method: 'POST', body }),
      // 'Report' too, so the dashboard "Active employees" tile refreshes on add/remove.
      invalidatesTags: ['Employee', 'Report'],
    }),
    updateEmployee: b.mutation({
      query: ({ id, ...body }) => ({ url: `/employees/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Employee', 'Report'],
    }),
    deleteEmployee: b.mutation({
      query: (id) => ({ url: `/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Employee', 'Report'],
    }),
    setEmployeeStatus: b.mutation({
      query: ({ id, ...body }) => ({ url: `/employees/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Employee', 'Report'],
    }),
    markAttendance: b.mutation({
      query: ({ id, ...body }) => ({ url: `/employees/${id}/attendance`, method: 'POST', body }),
      invalidatesTags: ['Attendance'],
    }),
    listAttendance: b.query({
      query: (params = {}) => ({ url: '/employees/attendance/list', params }),
      providesTags: ['Attendance'],
    }),
    attendanceSummary: b.query({
      query: ({ id, ...params }) => ({ url: `/employees/${id}/attendance/summary`, params }),
      providesTags: ['Attendance'],
    }),

    // ===== Payments =====
    listPayments: b.query({
      query: (params = {}) => ({ url: '/payments', params }),
      providesTags: ['Payment'],
    }),
    paymentsForOrder: b.query({
      query: (orderId) => `/payments/by-order/${orderId}`,
      providesTags: ['Payment'],
    }),
    recordPayment: b.mutation({
      query: (body) => ({ url: '/payments', method: 'POST', body }),
      invalidatesTags: ['Payment', 'Order'],
    }),
    updatePaymentStatus: b.mutation({
      query: ({ id, ...body }) => ({ url: `/payments/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Payment', 'Order'],
    }),
    refundPayment: b.mutation({
      query: ({ id, reason }) => ({ url: `/payments/${id}/refund`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Payment', 'Order'],
    }),
    paymentStats: b.query({
      query: (params = {}) => ({ url: '/payments/stats', params }),
      providesTags: ['Payment'],
    }),

    // ===== Finance =====
    financeOverview: b.query({
      query: (params = {}) => ({ url: '/finance/overview', params }),
      providesTags: ['Finance'],
    }),
    revenueTimeSeries: b.query({
      query: (params = {}) => ({ url: '/finance/revenue-time-series', params }),
      providesTags: ['Finance'],
    }),
    topCustomers: b.query({
      query: (params = {}) => ({ url: '/finance/top-customers', params }),
      providesTags: ['Finance'],
    }),
    topSuppliers: b.query({
      query: (params = {}) => ({ url: '/finance/top-suppliers', params }),
      providesTags: ['Finance'],
    }),
    receivables: b.query({
      query: (params = {}) => ({ url: '/finance/receivables', params }),
      providesTags: ['Finance'],
    }),
    payables: b.query({
      query: (params = {}) => ({ url: '/finance/payables', params }),
      providesTags: ['Finance'],
    }),

    // ===== Reports =====
    dashboardSnapshot: b.query({
      query: () => '/reports/dashboard',
      providesTags: ['Report'],
    }),
    salesReport: b.query({
      query: (params = {}) => ({ url: '/reports/sales', params }),
      providesTags: ['Report'],
    }),
    topProducts: b.query({
      query: (params = {}) => ({ url: '/reports/top-products', params }),
      providesTags: ['Report'],
    }),
    inventoryReport: b.query({
      query: (params = {}) => ({ url: '/reports/inventory', params }),
      providesTags: ['Report'],
    }),
    activityFeed: b.query({
      query: (params = {}) => ({ url: '/reports/activity-feed', params }),
      providesTags: ['Report'],
    }),
    stockValueReport: b.query({
      query: () => '/reports/stock-value',
      providesTags: ['Report'],
    }),
  }),
});

export const {
  useListCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useMyCustomerProfileQuery,
  useUpdateMyCustomerProfileMutation,
  useAddMyAddressMutation,
  useUpdateMyAddressMutation,
  useRemoveMyAddressMutation,
  useListEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useSetEmployeeStatusMutation,
  useMarkAttendanceMutation,
  useListAttendanceQuery,
  useAttendanceSummaryQuery,
  useListPaymentsQuery,
  usePaymentsForOrderQuery,
  useRecordPaymentMutation,
  useUpdatePaymentStatusMutation,
  useRefundPaymentMutation,
  usePaymentStatsQuery,
  useFinanceOverviewQuery,
  useRevenueTimeSeriesQuery,
  useTopCustomersQuery,
  useTopSuppliersQuery,
  useReceivablesQuery,
  usePayablesQuery,
  useDashboardSnapshotQuery,
  useSalesReportQuery,
  useTopProductsQuery,
  useInventoryReportQuery,
  useActivityFeedQuery,
  useStockValueReportQuery,
} = peopleApi;
