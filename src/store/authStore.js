import { create } from 'zustand';
import authService from '../services/authService';
import { setTokens, clearTokens, getAccessToken } from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true until initial check completes

  /**
   * Check if user is logged in on app start.
   * Calls GET /auth/me if token exists.
   */
  initialize: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const { data } = await authService.getMe();
      const user = data.data?.user ?? data.data;
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  /**
   * Login — POST /auth/login
   */
  login: async ({ email, password }) => {
    const { data } = await authService.login({ email, password });
    setTokens(data.data.tokens);
    set({ user: data.data.user, isAuthenticated: true });
    return data;
  },

  /**
   * Register — POST /auth/register
   */
  register: async ({ name, email, password }) => {
    const { data } = await authService.register({ name, email, password });
    setTokens(data.data.tokens);
    set({ user: data.data.user, isAuthenticated: true });
    return data;
  },

  /**
   * Logout — POST /auth/logout
   */
  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore error — still clear local state
    } finally {
      clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  /**
   * Forgot password — POST /auth/forgot-password
   */
  forgotPassword: async ({ email }) => {
    const { data } = await authService.forgotPassword({ email });
    return data;
  },

  /**
   * Reset password — POST /auth/reset-password/:token
   */
  resetPassword: async ({ token, password, confirmPassword }) => {
    const { data } = await authService.resetPassword({ token, password, confirmPassword });
    return data;
  },

  /**
   * Update current user in store (after profile update, etc.)
   */
  setUser: (user) => set({ user }),
}));

export default useAuthStore;
