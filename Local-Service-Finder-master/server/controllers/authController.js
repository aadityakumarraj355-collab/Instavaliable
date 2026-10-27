const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');
const { sendResponse, sendError } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLogger');
const { validatePasswordStrength } = require('../utils/passwordValidator');
const { sendOtpEmail } = require('../services/emailService');

// @desc    Register a client or worker and dispatch 5-minute Email verification OTP
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role, phone, location } = req.body;

    if (!email || !name || !password) {
      return sendError(res, 400, 'Name, email, and password are required');
    }

    // Strict Security Guard: Administrative accounts can NEVER be created through public registration
    if (role && ['admin', 'super_admin'].includes(role.toLowerCase().trim())) {
      await createAuditLog({
        req,
        action: 'PUBLIC_ADMIN_REGISTRATION_ATTEMPT_BLOCKED',
        targetType: 'Security',
        details: { attemptedEmail: email, attemptedRole: role },
      });
      return sendError(
        res,
        403,
        'Unauthorized role assignment. Administrator accounts can only be created by the Super Admin.'
      );
    }

    // Role assignment strictly restricted to 'client' or 'worker'
    const assignedRole = role === 'worker' ? 'worker' : 'client';

    // Password confirmation check
    if (confirmPassword && password !== confirmPassword) {
      return sendError(res, 400, 'Passwords do not match');
    }

    // Password strength verification
    const pwdValidation = validatePasswordStrength(password);
    if (!pwdValidation.isValid) {
      return sendError(res, 400, pwdValidation.message);
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // If user exists and is already verified, reject duplicate registration
      if (user.isVerified) {
        return sendError(res, 400, 'An account with this email address already exists. Please sign in.');
      }

      // If user exists but is unverified, update details for this new attempt
      user.name = name.trim();
      user.password = password;
      user.role = assignedRole;
      user.phone = phone ? phone.trim() : user.phone;
      user.location = location ? location.trim() : user.location;
      await user.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: assignedRole,
        phone: phone ? phone.trim() : '',
        location: location ? location.trim() : '',
        accountStatus: 'active',
        isSuspended: false,
        isVerified: false,
      });

      if (assignedRole === 'worker') {
        await WorkerProfile.create({
          userId: user._id,
          skills: [],
          location: location ? location.trim() : '',
        });
      }
    }

    // Generate secure 6-digit OTP valid for 5 minutes
    const plainOtp = await Otp.generateAndSaveOtp({
      email: normalizedEmail,
      purpose: 'email_verification',
      validityMinutes: 5,
    });

    // Send the OTP email strictly awaiting SMTP confirmation
    try {
      await sendOtpEmail({
        to: normalizedEmail,
        otp: plainOtp,
        purpose: 'email_verification',
        name: user.name,
      });
    } catch (emailError) {
      console.error(`[AuthController] Registration OTP email failed for ${normalizedEmail}:`, emailError.message);

      // Invalidate the OTP record since delivery failed
      await Otp.deleteMany({ email: normalizedEmail, purpose: 'email_verification' });

      return res.status(503).json({
        success: false,
        message: emailError.message || 'Unable to send OTP. Please verify email and SMTP settings.',
        error: emailError.message,
      });
    }

    await createAuditLog({
      req,
      action: 'USER_REGISTRATION_OTP_DISPATCHED',
      targetType: 'User',
      targetId: user._id,
      details: { role: assignedRole, email: user.email },
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please check your email.',
      data: {
        email: normalizedEmail,
        role: assignedRole,
        requiresVerification: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Registration OTP and activate account
// @route   POST /api/auth/verify-registration-otp
// @access  Public
const verifyRegistrationOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, 400, 'Email and 6-digit verification OTP are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return sendError(res, 404, 'No pending account found with this email. Please register first.');
    }

    // If already verified, allow login
    if (user.isVerified) {
      const token = generateToken(user);
      return sendResponse(res, 200, 'Account is already verified. You are now logged in.', {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus || 'active',
          permissions: user.permissions || [],
          phone: user.phone,
          isVerified: true,
        },
      });
    }

    // Verify OTP against stored hash
    const verification = await Otp.verifyOtp({
      email: normalizedEmail,
      enteredOtp: otp.toString().trim(),
      purpose: 'email_verification',
    });

    if (!verification.success) {
      return sendError(res, 400, verification.message);
    }

    // Successfully verified: activate user
    user.isVerified = true;
    user.accountStatus = 'active';
    await user.save();

    await createAuditLog({
      req,
      action: 'USER_REGISTRATION_VERIFIED',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email, role: user.role },
    });

    const token = generateToken(user);

    sendResponse(res, 200, 'Account verified successfully! Welcome to Instavaliable.', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus || 'active',
        permissions: user.permissions || [],
        phone: user.phone,
        isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend Registration OTP
// @route   POST /api/auth/resend-registration-otp
// @access  Public
const resendRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Email address is required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return sendError(res, 404, 'No registration found for this email address.');
    }

    if (user.isVerified) {
      return sendError(res, 400, 'This account is already verified. Please log in directly.');
    }

    // Generate new OTP (invalidates any previous OTP)
    const plainOtp = await Otp.generateAndSaveOtp({
      email: normalizedEmail,
      purpose: 'email_verification',
      validityMinutes: 5,
    });

    try {
      await sendOtpEmail({
        to: normalizedEmail,
        otp: plainOtp,
        purpose: 'email_verification',
        name: user.name,
      });
    } catch (emailError) {
      console.error(`[AuthController] Resend OTP email failed for ${normalizedEmail}:`, emailError.message);
      await Otp.deleteMany({ email: normalizedEmail, purpose: 'email_verification' });

      return res.status(503).json({
        success: false,
        message: emailError.message || 'Unable to send OTP. Please verify email and SMTP settings.',
        error: emailError.message,
      });
    }

    await createAuditLog({
      req,
      action: 'REGISTRATION_OTP_RESENT',
      targetType: 'User',
      targetId: user._id,
      details: { email: normalizedEmail },
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please check your email.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    General User Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Guard: Prevent unverified users from logging in (unless Super Admin)
    if (user.role !== 'super_admin' && user.isVerified === false) {
      return res.status(403).json({
        success: false,
        isUnverified: true,
        email: user.email,
        message: 'Your account is not verified. Please verify your email address to log in.',
      });
    }

    // Check account moderation status
    const isSuspendedOrBlocked =
      user.isSuspended ||
      ['suspended', 'blocked', 'restricted'].includes(user.accountStatus);

    if (isSuspendedOrBlocked) {
      // Check if temporary suspension expired
      if (user.suspensionEndDate && new Date() > new Date(user.suspensionEndDate)) {
        user.accountStatus = 'active';
        user.isSuspended = false;
        user.suspensionReason = '';
        user.suspensionDuration = '';
        user.suspensionEndDate = undefined;
        await user.save();
      } else {
        const statusType = user.accountStatus || (user.isSuspended ? 'suspended' : 'blocked');
        const reason = user.suspensionReason ? ` Reason: ${user.suspensionReason}.` : '';
        const duration = user.suspensionDuration ? ` Duration: ${user.suspensionDuration}.` : '';

        return sendError(
          res,
          403,
          `Your account has been ${statusType} by marketplace administration.${reason}${duration} Please contact support.`
        );
      }
    }

    const token = generateToken(user);

    // Track last login IP and time
    const ip = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    await User.findByIdAndUpdate(user._id, { lastIp: ip, lastLoginAt: new Date() });

    sendResponse(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus || 'active',
        permissions: user.permissions || [],
        profileImage: user.profileImage,
        phone: user.phone,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dedicated Administrator Login
// @route   POST /api/auth/admin-login
// @access  Public (Restricted to Admin & Super Admin)
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Administrator credentials are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      await createAuditLog({
        req,
        action: 'FAILED_ADMIN_LOGIN_UNKNOWN_EMAIL',
        targetType: 'Administrator',
        details: { emailAttempted: email },
      });
      return sendError(res, 401, 'Invalid administrator credentials');
    }

    // Role check: Only admin and super_admin are allowed here
    if (!['super_admin', 'admin'].includes(user.role)) {
      await createAuditLog({
        req,
        action: 'UNAUTHORIZED_ADMIN_PORTAL_ACCESS_ATTEMPT',
        targetType: 'User',
        targetId: user._id,
        details: { email: user.email, actualRole: user.role },
      });
      return sendError(res, 403, 'Access denied. You do not have administrator privileges.');
    }

    if (user.isSuspended || user.accountStatus === 'suspended') {
      await createAuditLog({
        req,
        action: 'SUSPENDED_ADMIN_LOGIN_ATTEMPT',
        targetType: 'Administrator',
        targetId: user._id,
        details: { email: user.email },
      });
      return sendError(res, 403, 'Administrator account has been suspended. Contact Super Admin.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await createAuditLog({
        req,
        action: 'FAILED_ADMIN_LOGIN_PASSWORD_MISMATCH',
        targetType: 'Administrator',
        targetId: user._id,
        details: { email: user.email },
      });
      return sendError(res, 401, 'Invalid administrator credentials');
    }

    const token = generateToken(user);

    // Track last login
    const ip = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    await User.findByIdAndUpdate(user._id, { lastIp: ip, lastLoginAt: new Date() });

    await createAuditLog({
      req: { ...req, user },
      action: 'ADMIN_LOGIN_SUCCESS',
      targetType: 'Administrator',
      targetId: user._id,
      details: { role: user.role, email: user.email },
    });

    sendResponse(res, 200, 'Administrator authenticated', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus || 'active',
        permissions: user.permissions || [],
        profileImage: user.profileImage,
        phone: user.phone,
        isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Reset OTP (Unauthenticated)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 400, 'Registered email address is required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Account enumeration protection: Always return standard message
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification code has been dispatched.',
      });
    }

    // Generate secure 6-digit OTP valid for 5 minutes
    const plainOtp = await Otp.generateAndSaveOtp({
      email: normalizedEmail,
      purpose: 'password_reset',
      validityMinutes: 5,
    });

    // Send email strictly awaiting delivery confirmation
    try {
      await sendOtpEmail({
        to: normalizedEmail,
        otp: plainOtp,
        purpose: 'password_reset',
        name: user.name,
      });
    } catch (emailError) {
      console.error(`[AuthController] Password reset OTP email failed for ${normalizedEmail}:`, emailError.message);
      await Otp.deleteMany({ email: normalizedEmail, purpose: 'password_reset' });

      return res.status(503).json({
        success: false,
        message: 'Unable to send OTP. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined,
      });
    }

    await createAuditLog({
      req,
      action: 'PASSWORD_RESET_OTP_REQUESTED',
      targetType: 'User',
      targetId: user._id,
      details: { email: normalizedEmail },
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please check your email.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and Reset Password (Unauthenticated)
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return sendError(res, 400, 'Email, OTP, and new password are required');
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return sendError(res, 400, 'Passwords do not match');
    }

    const pwdValidation = validatePasswordStrength(newPassword);
    if (!pwdValidation.isValid) {
      return sendError(res, 400, pwdValidation.message);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return sendError(res, 404, 'User account not found');
    }

    // Verify OTP against stored hash
    const verification = await Otp.verifyOtp({
      email: normalizedEmail,
      enteredOtp: otp.toString().trim(),
      purpose: 'password_reset',
    });

    if (!verification.success) {
      return sendError(res, 400, verification.message);
    }

    // Update password (pre-save middleware handles bcrypt hashing)
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Revoke all older JWT tokens
    await user.save();

    await createAuditLog({
      req,
      action: 'PASSWORD_RESET_SUCCESS',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email },
    });

    sendResponse(res, 200, 'Password has been reset successfully. Please log in with your new password.');
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Change OTP (Authenticated User)
// @route   POST /api/auth/request-password-change-otp
// @access  Private
const requestPasswordChangeOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const plainOtp = await Otp.generateAndSaveOtp({
      email: user.email,
      purpose: 'password_change',
      validityMinutes: 5,
    });

    try {
      await sendOtpEmail({
        to: user.email,
        otp: plainOtp,
        purpose: 'password_change',
        name: user.name,
      });
    } catch (emailError) {
      console.error(`[AuthController] Password change OTP email failed for ${user.email}:`, emailError.message);
      await Otp.deleteMany({ email: user.email, purpose: 'password_change' });

      return res.status(503).json({
        success: false,
        message: 'Unable to send OTP. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined,
      });
    }

    await createAuditLog({
      req: { ...req, user },
      action: 'PASSWORD_CHANGE_OTP_REQUESTED',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email },
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Please check your email.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm Password Change with OTP (Authenticated User)
// @route   POST /api/auth/confirm-password-change
// @access  Private
const confirmPasswordChange = async (req, res, next) => {
  try {
    const { currentPassword, otp, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !otp || !newPassword) {
      return sendError(res, 400, 'Current password, email OTP, and new password are all strictly required');
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return sendError(res, 400, 'New password and confirmation do not match');
    }

    const pwdValidation = validatePasswordStrength(newPassword);
    if (!pwdValidation.isValid) {
      return sendError(res, 400, pwdValidation.message);
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Verify current password first
    const isCurrentValid = await user.matchPassword(currentPassword);
    if (!isCurrentValid) {
      await createAuditLog({
        req: { ...req, user },
        action: 'PASSWORD_CHANGE_FAILED_CURRENT_PASSWORD_MISMATCH',
        targetType: 'User',
        targetId: user._id,
        details: { email: user.email },
      });
      return sendError(res, 401, 'Current password entered is incorrect');
    }

    // Verify OTP
    const verification = await Otp.verifyOtp({
      email: user.email,
      enteredOtp: otp.toString().trim(),
      purpose: 'password_change',
    });

    if (!verification.success) {
      return sendError(res, 400, verification.message);
    }

    // Update password
    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate older sessions
    await user.save();

    await createAuditLog({
      req: { ...req, user },
      action: 'PASSWORD_CHANGE_SUCCESS',
      targetType: 'User',
      targetId: user._id,
      details: { email: user.email },
    });

    // Generate fresh session token
    const freshToken = generateToken(user);

    sendResponse(res, 200, 'Your password has been changed successfully.', {
      token: freshToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    sendResponse(res, 200, 'Profile fetched', req.user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
