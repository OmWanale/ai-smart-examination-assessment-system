import { create } from 'zustand';
import { authAPI } from '../api/client';

// ============================================
// DEV AUTH BYPASS – REMOVE BEFORE PROD
// Frontend-only auth bypass - NO backend calls
// ============================================
const DEV_BYPASS_AUTH = true;
const MOCK_USER = {
  id: 'dev-teacher-id',
  name: 'Demo Teacher',
  email: 'demo@teacher.com',
  role: 'teacher',
  avatar: null,
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
};
const MOCK_TOKEN = 'DEV_FAKE_JWT_TOKEN';
// ============================================

// DEV AUTH BYPASS – REMOVE BEFORE PROD
// Initialize mock auth immediately if bypass enabled
const initializeMockAuth = () => {
  if (!DEV_BYPASS_AUTH) return { user: null, token: null };
  
  console.log('[DEV BYPASS] Frontend-only auth bypass active - NO backend calls');
  localStorage.setItem('authToken', MOCK_TOKEN);
  localStorage.setItem('user', JSON.stringify(MOCK_USER));
  
  return { user: MOCK_USER, token: MOCK_TOKEN };
};

const mockAuth = DEV_BYPASS_AUTH ? initializeMockAuth() : { user: null, token: null };

export const useAuthStore = create((set) => ({
  // DEV AUTH BYPASS – REMOVE BEFORE PROD
  // Initialize with mock user/token if bypass enabled
  user: mockAuth.user || JSON.parse(localStorage.getItem('user') || 'null'),
  token: mockAuth.token || localStorage.getItem('authToken') || null,
  isLoading: false,
  error: null,

  // DEV AUTH BYPASS – REMOVE BEFORE PROD
  // No-op function for compatibility
  initializeDevBypass: () => {
    if (DEV_BYPASS_AUTH) {
      console.log('[DEV BYPASS] Already initialized - skipping');
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

  // Login with email/password
  login: async (email, password) => {
    // DEV AUTH BYPASS – REMOVE BEFORE PROD
    // Skip backend call, use mock data immediately
    if (DEV_BYPASS_AUTH) {
      console.log('[DEV BYPASS] Login bypassed - using mock user');
      localStorage.setItem('authToken', MOCK_TOKEN);
      localStorage.setItem('user', JSON.stringify(MOCK_USER));
      set({ user: MOCK_USER, token: MOCK_TOKEN, isLoading: false, error: null });
      return { success: true };
    }

    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Register with email/password
  register: async (email, password) => {
    // DEV AUTH BYPASS – REMOVE BEFORE PROD
    // Skip backend call, use mock data immediately
    if (DEV_BYPASS_AUTH) {
      console.log('[DEV BYPASS] Register bypassed - using mock user');
      localStorage.setItem('authToken', MOCK_TOKEN);
      localStorage.setItem('user', JSON.stringify(MOCK_USER));
      set({ user: MOCK_USER, token: MOCK_TOKEN, isLoading: false, error: null });
      return { success: true };
    }

    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
    // DEV AUTH BYPASS – REMOVE BEFORE PROD
    // Skip backend call, return mock user
    if (DEV_BYPASS_AUTH) {
      console.log('[DEV BYPASS] getMe bypassed - returning mock user');
      set({ user: MOCK_USER, isLoading: false });
      return MOCK_USER;
    }

      return { success: true };
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
      const user = response.data;
      
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
    // DEV AUTH BYPASS - REMOVE LATER
    // In dev mode, keep user "logged in" to avoid re-auth
    if (DEV_BYPASS_AUTH) {
      console.log('[DEV BYPASS] Logout ignored in dev mode');
      return;
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, error: null });
  },
}));
