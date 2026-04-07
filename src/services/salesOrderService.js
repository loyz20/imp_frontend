import apiClient from '../api/axios';

const salesOrderService = {
  // Get All SOs — GET /sales-orders
  getAll: (params = {}) =>
    apiClient.get('/sales-orders', { params }),

  // Get SO Stats — GET /sales-orders/stats
  getStats: () =>
    apiClient.get('/sales-orders/stats'),

  // Get SO by ID — GET /sales-orders/:id
  getById: (id) =>
    apiClient.get(`/sales-orders/${id}`),

  // Create SO — POST /sales-orders
  create: (data) =>
    apiClient.post('/sales-orders', data),

  // Update SO — PUT /sales-orders/:id
  update: (id, data) =>
    apiClient.put(`/sales-orders/${id}`, data),

  // Delete SO — DELETE /sales-orders/:id
  remove: (id) =>
    apiClient.delete(`/sales-orders/${id}`),

  // Change SO Status — PATCH /sales-orders/:id/status
  changeStatus: (id, status, notes) =>
    apiClient.patch(`/sales-orders/${id}/status`, { status, notes }),
};

export default salesOrderService;
