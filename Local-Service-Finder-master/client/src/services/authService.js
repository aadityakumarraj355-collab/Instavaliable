import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data),
  verifyRegistrationOtp: (data) => api.post('/auth/verify-registration-otp', data),
  resendRegistrationOtp: (data) => api.post('/auth/resend-registration-otp', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  requestPasswordChangeOtp: () => api.post('/auth/request-password-change-otp'),
  confirmPasswordChange: (data) => api.post('/auth/confirm-password-change', data),
  getMe: () => api.get('/auth/me'),
}
