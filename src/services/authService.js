import apiClient from '../api/axios';

const authService = {
  /**
   * POST /auth/register
   */
  register: ({ name, email, password }) =>
    apiClient.post('/auth/register', { name, email, password }),

  /**
   * POST /auth/login
   */
  login: ({ email, password }) =>
    apiClient.post('/auth/login', { email, password }),

  /**
   * POST /auth/forgot-password
   */
  forgotPassword: ({ email }) =>
    apiClient.post('/auth/forgot-password', { email }),

  /**
   * POST /auth/reset-password/:token
   */
  resetPassword: ({ token, password, confirmPassword }) =>
    apiClient.post(`/auth/reset-password/${token}`, { password, confirmPassword }),

  /**
   * GET /auth/verify-email/:token
   */
  verifyEmail: (token) =>
    apiClient.get(`/auth/verify-email/${token}`),

  /**
   * POST /auth/logout
   */
  logout: () =>
    apiClient.post('/auth/logout'),

  /**
   * GET /auth/me
   */
  getMe: () =>
    apiClient.get('/auth/me'),

  /**
   * PUT /auth/update-profile
   */
  updateProfile: (data) =>
    apiClient.put('/auth/update-profile', data),

  /**
   * PUT /auth/change-password
   */
  changePassword: ({ currentPassword, newPassword, confirmPassword }) =>
    apiClient.put('/auth/change-password', { currentPassword, newPassword, confirmPassword }),

  /**
   * POST /auth/resend-verification
   */
  resendVerification: () =>
    apiClient.post('/auth/resend-verification'),
};

export default authService;
