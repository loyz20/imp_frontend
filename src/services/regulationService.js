import apiClient from '../api/axios';

const regulationService = {
  /* ── Surat Pesanan Khusus ── */

  // GET /regulation/sp
  getSPList: (params = {}) =>
    apiClient.get('/regulation/sp', { params }),

  // GET /regulation/sp/stats
  getSPStats: () =>
    apiClient.get('/regulation/sp/stats'),

  // GET /regulation/sp/:id
  getSPById: (id) =>
    apiClient.get(`/regulation/sp/${id}`),

  // POST /regulation/sp
  createSP: (data) =>
    apiClient.post('/regulation/sp', data),

  // PATCH /regulation/sp/:id/status
  updateSPStatus: (id, status) =>
    apiClient.patch(`/regulation/sp/${id}/status`, { status }),

  // GET /regulation/sp/:id/pdf (blob)
  exportSPPdf: (id) =>
    apiClient.get(`/regulation/sp/${id}/pdf`, { responseType: 'blob' }),

  /* ── e-Report BPOM ── */

  // GET /regulation/ereport
  getEReports: (params = {}) =>
    apiClient.get('/regulation/ereport', { params }),

  // GET /regulation/ereport/stats
  getEReportStats: () =>
    apiClient.get('/regulation/ereport/stats'),

  // POST /regulation/ereport/generate
  generateEReport: (data) =>
    apiClient.post('/regulation/ereport/generate', data),

  // POST /regulation/ereport/:id/submit
  submitEReport: (id) =>
    apiClient.post(`/regulation/ereport/${id}/submit`),

  // POST /regulation/ereport/export-pdf (blob)
  exportEReportPdf: (data) =>
    apiClient.post('/regulation/ereport/export-pdf', data, { responseType: 'blob' }),

  /* ── Dokumen Perizinan ── */

  // GET /regulation/documents
  getDocuments: () =>
    apiClient.get('/regulation/documents'),

  // GET /regulation/documents/stats
  getDocStats: () =>
    apiClient.get('/regulation/documents/stats'),

  // POST /regulation/documents/:id/upload (multipart/form-data)
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/regulation/documents/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default regulationService;
