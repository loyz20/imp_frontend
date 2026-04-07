import apiClient from '../api/axios';

const goodsReceivingService = {
  // Get All Goods Receivings — GET /goods-receivings
  getAll: (params = {}) =>
    apiClient.get('/goods-receivings', { params }),

  // Get GR Stats — GET /goods-receivings/stats
  getStats: () =>
    apiClient.get('/goods-receivings/stats'),

  // Get GR by ID — GET /goods-receivings/:id
  getById: (id) =>
    apiClient.get(`/goods-receivings/${id}`),

  // Create GR — POST /goods-receivings
  create: (data) =>
    apiClient.post('/goods-receivings', data),

  // Update GR — PUT /goods-receivings/:id
  update: (id, data) =>
    apiClient.put(`/goods-receivings/${id}`, data),

  // Delete GR — DELETE /goods-receivings/:id
  remove: (id) =>
    apiClient.delete(`/goods-receivings/${id}`),

  // Verify/Complete GR — PATCH /goods-receivings/:id/verify
  verify: (id, notes) =>
    apiClient.patch(`/goods-receivings/${id}/verify`, { notes }),

  // Get POs available for receiving — GET /goods-receivings/available-pos
  getAvailablePOs: (params = {}) =>
    apiClient.get('/goods-receivings/available-pos', { params }),
};

export default goodsReceivingService;
