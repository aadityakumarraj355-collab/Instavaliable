import api from './api'

export const adminService = {
  // Marketplace & General Stats
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  suspendUser: (id, data) => api.put(`/admin/users/${id}/suspend`, data),
  verifyWorker: (id) => api.put(`/admin/workers/${id}/verify`),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  deleteService: (id) => api.delete(`/admin/services/${id}`),

  // Feature 1: Customer Management
  getCustomers: (params) => api.get('/admin/customers', { params }),

  // Feature 2: Service Provider Management
  getWorkers: (params) => api.get('/admin/workers', { params }),

  // Feature 3 & 4: User ID Search & Account Moderation (Suspend / Block / Restore)
  getUserByIdDetail: (userId) => api.get(`/admin/users/${userId}/detail`),
  moderateUser: (userId, data) => api.post(`/admin/users/${userId}/moderate`, data),
  getUserModerationHistory: (userId) => api.get(`/admin/users/${userId}/moderation-history`),
  getAllModerationHistory: (params) => api.get('/admin/moderation-history', { params }),

  // Super Admin Administrator Management
  getAdministrators: (params) => api.get('/admin/administrators', { params }),
  createAdministrator: (data) => api.post('/admin/administrators', data),
  updateAdministrator: (id, data) => api.put(`/admin/administrators/${id}`, data),
  toggleAdminStatus: (id) => api.put(`/admin/administrators/${id}/status`),
  revokeAdminSession: (id) => api.post(`/admin/administrators/${id}/revoke-sessions`),
  deleteAdministrator: (id) => api.delete(`/admin/administrators/${id}`),

  // Admin Profile (Self)
  getAdminProfile: () => api.get('/admin/profile'),
  updateAdminProfile: (data) => api.put('/admin/profile', data),

  // Audit Logs & Database
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getDatabaseOverview: () => api.get('/admin/database/overview'),
}
