import { createSlice } from '@reduxjs/toolkit';

const initial = {
  user: null,
  isAuthenticated: false,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setUser(state, { payload }) {
      state.user = payload;
      state.isAuthenticated = !!payload;
      state.initialized = true;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.initialized = true;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectRole = (state) => state.auth.user?.role;
export const selectIsStaff = (state) => {
  const r = state.auth.user?.role;
  return r === 'admin' || r === 'super_admin';
};
