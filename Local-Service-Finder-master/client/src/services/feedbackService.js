import api from './api'

export const feedbackService = {
  // Client
  submitFeedback: (data) => api.post('/feedback', data),
  getMyFeedback: () => api.get('/feedback/my-feedback'),

  // Public / Provider
  getProviderFeedback: (providerId) => api.get(`/feedback/provider/${providerId}`),
  getWorkerReviews: () => api.get('/feedback/worker/my-reviews'),

  // Admin
  getAdminFeedbacks: (params) => api.get('/feedback/admin', { params }),
  moderateFeedback: (id, data) => api.put(`/feedback/admin/${id}/moderate`, data),
}
