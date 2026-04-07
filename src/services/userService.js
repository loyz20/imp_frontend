import apiClient from '../api/axios';

const userService = {
  getAll: (params = {}) =>
    apiClient.get('/users', { params }),

  getStats: () =>
    apiClient.get('/users/stats'),

  getById: (id) =>
    apiClient.get(`/users/${id}`),

  create: (data) =>
    apiClient.post('/users', data),

  update: (id, data) =>
    apiClient.put(`/users/${id}`, data),

  remove: (id) =>
    apiClient.delete(`/users/${id}`),

  changeRole: (id, role) =>
    apiClient.patch(`/users/${id}/role`, { role }),

  changeStatus: (id, isActive) =>
    apiClient.patch(`/users/${id}/status`, { isActive }),
};

export default userService;
