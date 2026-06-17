import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    theme: 'light',
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebar(state, { payload }) {
      state.sidebarOpen = payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    },
  },
});

export const { toggleSidebar, setSidebar, toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
