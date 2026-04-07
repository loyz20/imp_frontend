import apiClient from '../api/axios';

const deliveryService = {
  // Get All Deliveries — GET /deliveries
  getAll: (params = {}) =>
    apiClient.get('/deliveries', { params }),

  // Get Delivery Stats — GET /deliveries/stats
  getStats: () =>
    apiClient.get('/deliveries/stats'),

  // Get Delivery by ID — GET /deliveries/:id
  getById: (id) =>
    apiClient.get(`/deliveries/${id}`),

  // Create Delivery — POST /deliveries
  create: (data) =>
    apiClient.post('/deliveries', data),

  // Update Delivery — PUT /deliveries/:id
  update: (id, data) =>
    apiClient.put(`/deliveries/${id}`, data),

  // Delete Delivery — DELETE /deliveries/:id
  remove: (id) =>
    apiClient.delete(`/deliveries/${id}`),

  // Change Delivery Status — PATCH /deliveries/:id/status
  changeStatus: (id, status, notes) =>
    apiClient.patch(`/deliveries/${id}/status`, { status, notes }),

  // Get available SOs for delivery — GET /deliveries/available-orders
  getAvailableOrders: (params = {}) =>
    apiClient.get('/deliveries/available-orders', { params }),
};

export default deliveryService;
