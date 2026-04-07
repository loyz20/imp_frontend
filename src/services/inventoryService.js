import apiClient from '../api/axios';

const inventoryService = {
  /* ── Sub-modul 1: Stok Gudang ── */

  // 10.1 Get Stock Summary — GET /inventory/stock
  getStock: (params = {}) =>
    apiClient.get('/inventory/stock', { params }),

  // 10.2 Get Stock Stats — GET /inventory/stock/stats
  getStockStats: () =>
    apiClient.get('/inventory/stock/stats'),

  // 10.3 Get Product Batches — GET /inventory/stock/:productId/batches
  getProductBatches: (productId, params = {}) =>
    apiClient.get(`/inventory/stock/${productId}/batches`, { params }),

  /* ── Sub-modul 2: Mutasi Stok ── */

  // 10.4 Get All Mutations — GET /inventory/mutations
  getMutations: (params = {}) =>
    apiClient.get('/inventory/mutations', { params }),

  // 10.5 Get Mutation Stats — GET /inventory/mutations/stats
  getMutationStats: () =>
    apiClient.get('/inventory/mutations/stats'),

  // 10.6 Create Manual Mutation — POST /inventory/mutations
  createMutation: (data) =>
    apiClient.post('/inventory/mutations', data),

  /* ── Sub-modul 3: Stok Opname ── */

  // 10.7 Get All Opname Sessions — GET /inventory/opname
  getOpnames: (params = {}) =>
    apiClient.get('/inventory/opname', { params }),

  // 10.8 Get Opname Stats — GET /inventory/opname/stats
  getOpnameStats: () =>
    apiClient.get('/inventory/opname/stats'),

  // 10.9 Create Opname Session — POST /inventory/opname
  createOpname: (data) =>
    apiClient.post('/inventory/opname', data),

  // 10.10 Get Opname by ID — GET /inventory/opname/:id
  getOpnameById: (id) =>
    apiClient.get(`/inventory/opname/${id}`),

  // 10.11 Update Opname — PUT /inventory/opname/:id
  updateOpname: (id, data) =>
    apiClient.put(`/inventory/opname/${id}`, data),

  // 10.12 Finalize Opname — PATCH /inventory/opname/:id/finalize
  finalizeOpname: (id, notes) =>
    apiClient.patch(`/inventory/opname/${id}/finalize`, { notes }),

  /* ── Sub-modul 4: Kartu Stok ── */

  // 10.13 Get Stock Card — GET /inventory/stock-card/:productId
  getStockCard: (productId, params = {}) =>
    apiClient.get(`/inventory/stock-card/${productId}`, { params }),

  /* ── Sub-modul 5: Expired / ED ── */

  // 10.14 Get Expired Items — GET /inventory/expired
  getExpired: (params = {}) =>
    apiClient.get('/inventory/expired', { params }),

  // 10.15 Get Expired Stats — GET /inventory/expired/stats
  getExpiredStats: () =>
    apiClient.get('/inventory/expired/stats'),
};

export default inventoryService;
