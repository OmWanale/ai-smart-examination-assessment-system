import { create } from 'zustand';
import { authAPI } from '../api/client';

export const useAuthStore = create((set, get) => ({
  // Initialize as null - will validate on app load
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  // Initialize auth from localStorage and validate token
  initializeAuth: async () => {
    try {
      const savedToken = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          // Validate token by fetching current user
          const response = await authAPI.getMe();
          const user = response.data.data.user;
          set({ user, token: savedToken, isInitialized: true });
          return;
        } catch (error) {
          // Token is invalid, clear everything
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      
      set({ user: null, token: null, isInitialized: true });
    } catch (err) {
      console.error('[AuthStore] Initialization error:', err);
      set({ user: null, token: null, isInitialized: true });
    }
  },

  // Set auth directly (used by OAuth callback)
  setAuth: (user, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, error: null });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Login with email/password and role
  login: async (email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password, role);
      const { token, user } = response.data.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Register with email/password and role
  register: async (email, password, name, role) => {
    set({ isLoading: true, error: null });
    try {
      let response;
      if (role === 'teacher') {
        response = await authAPI.registerTeacher(email, password, name);
      } else {
        response = await authAPI.registerStudent(email, password, name);
      }
      
      const { token, user } = response.data.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Fetch current user
  getMe: async () => {
    set({ isLoading: true });
    try {
      const response = await authAPI.getMe();
      const user = response.data.data.user;
      
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      set({ error: 'Failed to fetch user', isLoading: false });
      return null;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
  },
}));
