import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    register: b.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    login: b.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    logout: b.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Me'],
    }),
    getMe: b.query({
      query: () => '/auth/me',
      providesTags: ['Me'],
    }),
    updateMe: b.mutation({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['Me'],
    }),
    changePassword: b.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
    createStaff: b.mutation({
      query: (body) => ({ url: '/auth/create-staff', method: 'POST', body }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useCreateStaffMutation,
} = authApi;
