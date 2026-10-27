const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
  requestPasswordChangeOtp,
  confirmPasswordChange,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  authLimiter,
  registrationLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
} = require('../middleware/rateLimiter');

// Public client & worker registration (Rate-limited, strictly rejects admin roles, dispatches 5-min OTP)
router.post(
  '/register',
  registrationLimiter,
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('role')
      .optional()
      .isIn(['client', 'worker'])
      .withMessage('Public registration only permits client or worker accounts'),
  ],
  validate,
  register
);

// Verify Registration OTP (Rate-limited)
router.post(
  '/verify-registration-otp',
  otpVerifyLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('A valid 6-digit verification OTP is required'),
  ],
  validate,
  verifyRegistrationOtp
);

// Resend Registration OTP (Rate-limited)
router.post(
  '/resend-registration-otp',
  otpRequestLimiter,
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  validate,
  resendRegistrationOtp
);

// General customer/worker login (Rate-limited)
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// Dedicated Administrator / Super Admin Login (Rate-limited)
router.post(
  '/admin-login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid administrator email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  adminLogin
);

// Unauthenticated Password Reset Request (Email OTP)
router.post(
  '/forgot-password',
  otpRequestLimiter,
  [body('email').isEmail().normalizeEmail().withMessage('Valid email address is required')],
  validate,
  forgotPassword
);

// Unauthenticated Reset Password with OTP
router.post(
  '/reset-password',
  otpVerifyLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email address is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('A valid 6-digit verification OTP is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long'),
  ],
  validate,
  resetPassword
);

// Authenticated Password Change: Request OTP
router.post(
  '/request-password-change-otp',
  protect,
  otpRequestLimiter,
  requestPasswordChangeOtp
);

// Authenticated Password Change: Verify OTP & Update
router.post(
  '/confirm-password-change',
  protect,
  otpVerifyLimiter,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('A valid 6-digit verification OTP is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long'),
  ],
  validate,
  confirmPasswordChange
);

// Get authenticated user identity
router.get('/me', protect, getMe);

module.exports = router;
