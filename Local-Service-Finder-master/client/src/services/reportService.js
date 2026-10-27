import api from './api'

export const reportService = {
  // Client
  createReport: (data) => api.post('/reports', data),
  getMyReports: () => api.get('/reports/my-reports'),

  // Admin
  getAdminReports: (params) => api.get('/reports/admin', { params }),
  updateReportStatus: (id, data) => api.put(`/reports/admin/${id}`, data),
}
