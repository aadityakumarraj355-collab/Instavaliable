const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const WorkerProfile = require('../models/WorkerProfile');
const AuditLog = require('../models/AuditLog');
const SystemConfig = require('../models/SystemConfig');
const WhatsAppContact = require('../models/WhatsAppContact');
const ModerationHistory = require('../models/ModerationHistory');
const Feedback = require('../models/Feedback');
const Report = require('../models/Report');
const { sendResponse, sendError } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLogger');
const mongoose = require('mongoose');

// Available standard administrator permissions (Super Admin has all implicitly)
const ALL_ADMIN_PERMISSIONS = [
  'manage_customers',
  'manage_workers',
  'manage_services',
  'manage_bookings',
  'manage_whatsapp',
  'manage_database',
  'view_audit_logs',
];

// ============================================================================
// 1. INITIAL SUPER ADMIN SETUP
// ============================================================================

// @desc    Secure initial setup for the first Super Admin
// @route   POST /api/admin/setup-initial-super-admin
// @access  Protected by setup secret (Disabled once initial Super Admin exists)
const setupInitialSuperAdmin = async (req, res, next) => {
  try {
    const providedSecret =
      req.headers['x-setup-secret'] ||
      req.body.setupSecret ||
      req.query.setupSecret;

    const configuredSecret = process.env.ADMIN_SETUP_SECRET;

    if (!configuredSecret || !providedSecret || providedSecret !== configuredSecret) {
      return sendError(res, 403, 'Access denied: Invalid or missing setup secret');
    }

    // Check if initial setup has already been locked in SystemConfig
    let config = await SystemConfig.findOne();
    if (config && (config.isInitialSuperAdminCreated || config.initialSetupDisabled)) {
      return sendError(
        res,
        403,
        'Initial Super Admin setup is permanently disabled. Super Admin already exists.'
      );
    }

    // Secondary Check: Verify no super_admin exists in database
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      if (!config) config = await SystemConfig.create({});
      config.isInitialSuperAdminCreated = true;
      config.initialSetupDisabled = true;
      config.superAdminEmail = existingSuperAdmin.email;
      config.superAdminCreatedAt = existingSuperAdmin.createdAt;
      await config.save();

      return sendError(
        res,
        403,
        'Initial Super Admin setup is permanently disabled. Super Admin already exists.'
      );
    }

    // Credentials derived from environment variables or secure body
    const name = process.env.ADMIN_NAME || req.body.name || 'Instavaliable Super Admin';
    const email = (process.env.ADMIN_EMAIL || req.body.email || 'superadmin@instavaliable.com').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || req.body.password;

    if (!password || password.length < 8) {
      return sendError(res, 400, 'Password must be at least 8 characters long');
    }

    // If an existing user with this email exists, upgrade or block
    let superAdmin = await User.findOne({ email });
    if (superAdmin) {
      superAdmin.name = name;
      superAdmin.password = password; // pre-save will bcrypt hash
      superAdmin.role = 'super_admin';
      superAdmin.permissions = ALL_ADMIN_PERMISSIONS;
      superAdmin.isVerified = true;
      superAdmin.isSuspended = false;
      superAdmin.accountStatus = 'active';
      await superAdmin.save();
    } else {
      superAdmin = await User.create({
        name,
        email,
        password,
        role: 'super_admin',
        permissions: ALL_ADMIN_PERMISSIONS,
        isVerified: true,
        isSuspended: false,
        accountStatus: 'active',
      });
    }

    // Permanently disable initial setup in SystemConfig
    if (!config) config = await SystemConfig.create({});
    config.isInitialSuperAdminCreated = true;
    config.initialSetupDisabled = true;
    config.superAdminEmail = superAdmin.email;
    config.superAdminCreatedAt = new Date();
    await config.save();

    // Audit log
    await createAuditLog({
      req: { ...req, user: superAdmin },
      action: 'SETUP_INITIAL_SUPER_ADMIN_HTTP',
      targetType: 'Administrator',
      targetId: superAdmin._id,
      details: { email: superAdmin.email, timestamp: new Date() },
    });

    sendResponse(res, 201, 'Super Admin established. Setup is permanently disabled.', {
      superAdmin: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        permissions: superAdmin.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. SUPER ADMIN CREATES & MANAGES ADMINISTRATORS
// ============================================================================

// @desc    Get all administrator accounts
// @route   GET /api/admin/administrators
// @access  Private (Super Admin Only)
const getAdministrators = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = { role: { $in: ['admin', 'super_admin'] } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const administrators = await User.find(query)
      .select('-password')
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Administrators fetched successfully', {
      administrators,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new administrator with explicit permissions
// @route   POST /api/admin/administrators
// @access  Private (Super Admin Only)
const createAdministrator = async (req, res, next) => {
  try {
    const { name, email, password, phone, permissions } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, 'Name, email, and password are required');
    }

    if (password.length < 8) {
      return sendError(res, 400, 'Password must be at least 8 characters long');
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return sendError(res, 400, 'An account with this email address already exists');
    }

    // Validate explicitly granted permissions (prevent ordinary admins from granting super_admin)
    const validPermissions = Array.isArray(permissions)
      ? permissions.filter((p) => ALL_ADMIN_PERMISSIONS.includes(p))
      : [];

    const newAdmin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'admin', // Only the initial setup creates super_admin
      permissions: validPermissions,
      phone: phone ? phone.trim() : '',
      isVerified: true,
      accountStatus: 'active',
      isSuspended: false,
      createdBy: req.user._id,
      tokenVersion: 0,
    });

    await createAuditLog({
      req,
      action: 'CREATE_ADMINISTRATOR',
      targetType: 'Administrator',
      targetId: newAdmin._id,
      details: {
        createdAdminEmail: newAdmin.email,
        createdAdminName: newAdmin.name,
        assignedPermissions: newAdmin.permissions,
      },
    });

    sendResponse(res, 201, 'Administrator created successfully', {
      administrator: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions,
        phone: newAdmin.phone,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update administrator details & permissions
// @route   PUT /api/admin/administrators/:id
// @access  Private (Super Admin Only)
const updateAdministrator = async (req, res, next) => {
  try {
    const { name, phone, permissions, password } = req.body;
    const admin = await User.findById(req.params.id);

    if (!admin) return sendError(res, 404, 'Administrator not found');

    // Prevent ordinary admins from modifying Super Admin
    if (admin.role === 'super_admin' && req.user._id.toString() !== admin._id.toString()) {
      return sendError(res, 403, 'Cannot modify another Super Administrator account');
    }

    if (name) admin.name = name.trim();
    if (phone !== undefined) admin.phone = phone ? phone.trim() : '';

    // Only update permissions on ordinary admins (super_admin always has full permissions)
    if (admin.role !== 'super_admin' && Array.isArray(permissions)) {
      admin.permissions = permissions.filter((p) => ALL_ADMIN_PERMISSIONS.includes(p));
    }

    // Optional password reset by Super Admin
    if (password && password.length >= 8) {
      admin.password = password;
      admin.tokenVersion = (admin.tokenVersion || 0) + 1; // Invalidate previous sessions
    }

    await admin.save();

    await createAuditLog({
      req,
      action: 'UPDATE_ADMINISTRATOR',
      targetType: 'Administrator',
      targetId: admin._id,
      details: {
        adminEmail: admin.email,
        updatedPermissions: admin.permissions,
        passwordChanged: !!password,
      },
    });

    sendResponse(res, 200, 'Administrator updated successfully', {
      administrator: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        phone: admin.phone,
        isSuspended: admin.isSuspended,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or Reactivate an administrator
// @route   PUT /api/admin/administrators/:id/status
// @access  Private (Super Admin Only)
const toggleAdminStatus = async (req, res, next) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) return sendError(res, 404, 'Administrator not found');

    if (admin.role === 'super_admin') {
      return sendError(res, 400, 'Cannot suspend a Super Administrator account');
    }

    admin.isSuspended = !admin.isSuspended;
    admin.accountStatus = admin.isSuspended ? 'suspended' : 'active';
    if (admin.isSuspended) {
      admin.tokenVersion = (admin.tokenVersion || 0) + 1; // Invalidate active session immediately
    }
    await admin.save();

    const action = admin.isSuspended ? 'SUSPEND_ADMIN' : 'REACTIVATE_ADMIN';
    await createAuditLog({
      req,
      action,
      targetType: 'Administrator',
      targetId: admin._id,
      details: { adminEmail: admin.email, isSuspended: admin.isSuspended },
    });

    sendResponse(
      res,
      200,
      `Administrator ${admin.isSuspended ? 'suspended' : 'reactivated'} successfully`,
      { id: admin._id, isSuspended: admin.isSuspended, accountStatus: admin.accountStatus }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke all active sessions for an administrator
// @route   POST /api/admin/administrators/:id/revoke-sessions
// @access  Private (Super Admin Only)
const revokeAdminSession = async (req, res, next) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) return sendError(res, 404, 'Administrator not found');

    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    await admin.save();

    await createAuditLog({
      req,
      action: 'REVOKE_ADMIN_SESSIONS',
      targetType: 'Administrator',
      targetId: admin._id,
      details: { adminEmail: admin.email, newVersion: admin.tokenVersion },
    });

    sendResponse(res, 200, 'All active sessions for this administrator have been revoked');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete administrator account
// @route   DELETE /api/admin/administrators/:id
// @access  Private (Super Admin Only)
const deleteAdministrator = async (req, res, next) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) return sendError(res, 404, 'Administrator not found');

    // Security check: Prevent deletion of the last Super Admin
    if (admin.role === 'super_admin') {
      const superAdminCount = await User.countDocuments({ role: 'super_admin' });
      if (superAdminCount <= 1) {
        return sendError(res, 403, 'Forbidden: Cannot delete the only remaining Super Administrator');
      }
    }

    const email = admin.email;
    await admin.deleteOne();

    await createAuditLog({
      req,
      action: 'DELETE_ADMINISTRATOR',
      targetType: 'Administrator',
      targetId: req.params.id,
      details: { deletedEmail: email },
    });

    sendResponse(res, 200, 'Administrator account deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. ADMIN PROFILE MANAGEMENT (SELF)
// ============================================================================

// @desc    Get current administrator profile
// @route   GET /api/admin/profile
// @access  Private (Admin / Super Admin)
const getAdminProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    sendResponse(res, 200, 'Admin profile fetched', user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update own administrator profile
// @route   PUT /api/admin/profile
// @access  Private (Admin / Super Admin)
const updateAdminProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : '';
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Optional password change with current password verification
    if (newPassword) {
      if (!currentPassword) {
        return sendError(res, 400, 'Current password is required to change password');
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return sendError(res, 400, 'Current password does not match');
      }
      if (newPassword.length < 8) {
        return sendError(res, 400, 'New password must be at least 8 characters long');
      }
      user.password = newPassword;
      user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate other devices
    }

    await user.save();

    await createAuditLog({
      req,
      action: 'UPDATE_OWN_ADMIN_PROFILE',
      targetType: 'Administrator',
      targetId: user._id,
      details: {
        name: user.name,
        passwordChanged: !!newPassword,
      },
    });

    sendResponse(res, 200, 'Profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        phone: user.phone,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. AUDIT LOGS & DATABASE OVERVIEW
// ============================================================================

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Super Admin or 'view_audit_logs' permission)
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action = '' } = req.query;
    const query = {};
    if (action) query.action = { $regex: action, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Audit logs fetched', {
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get safe database overview metrics
// @route   GET /api/admin/database/overview
// @access  Private (Super Admin or 'manage_database' permission)
const getDatabaseOverview = async (req, res, next) => {
  try {
    const [
      userCount,
      workerProfileCount,
      serviceCount,
      bookingCount,
      auditLogCount,
      whatsAppCount,
      feedbackCount,
      reportCount,
      moderationCount,
    ] = await Promise.all([
      User.countDocuments(),
      WorkerProfile.countDocuments(),
      Service.countDocuments(),
      Booking.countDocuments(),
      AuditLog.countDocuments(),
      WhatsAppContact.countDocuments(),
      Feedback.countDocuments(),
      Report.countDocuments(),
      ModerationHistory.countDocuments(),
    ]);

    const dbStats = {
      dbName: mongoose.connection.name || 'instavaliable',
      connectionState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      host: mongoose.connection.host || 'localhost',
      collections: [
        { name: 'Users (Clients, Workers, Admins)', count: userCount },
        { name: 'Worker Profiles', count: workerProfileCount },
        { name: 'Services Marketplace Listings', count: serviceCount },
        { name: 'Bookings & Orders', count: bookingCount },
        { name: 'Customer Feedbacks & Reviews', count: feedbackCount },
        { name: 'Provider Safety Reports', count: reportCount },
        { name: 'Account Moderation History', count: moderationCount },
        { name: 'Audit Security Trail', count: auditLogCount },
        { name: 'WhatsApp Contacts', count: whatsAppCount },
      ],
      serverTime: new Date(),
    };

    sendResponse(res, 200, 'Database overview fetched', dbStats);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. FEATURE 1: CUSTOMER MANAGEMENT
// ============================================================================

// @desc    Get all registered customers with full metrics & search
// @route   GET /api/admin/customers
// @access  Private (Admin / Super Admin)
const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const query = { role: 'client' };

    if (status) query.accountStatus = status;

    if (search && search.trim()) {
      const term = search.trim();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(term);
      if (isObjectId) {
        query._id = term;
      } else {
        query.$or = [
          { name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
          { phone: { $regex: term, $options: 'i' } },
        ];
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean();

    // Attach booking count, feedback count, report count, and last moderation log
    const enriched = await Promise.all(
      customers.map(async (c) => {
        const [bookingCount, feedbackCount, reportCount, lastModeration] = await Promise.all([
          Booking.countDocuments({ clientId: c._id }),
          Feedback.countDocuments({ clientId: c._id }),
          Report.countDocuments({ reporterId: c._id }),
          ModerationHistory.findOne({ targetUserId: c._id }).sort({ createdAt: -1 }).lean(),
        ]);
        return {
          ...c,
          bookingCount,
          feedbackCount,
          reportCount,
          lastModeration,
        };
      })
    );

    sendResponse(res, 200, 'Customers fetched successfully', {
      customers: enriched,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. FEATURE 2: SERVICE PROVIDER MANAGEMENT
// ============================================================================

// @desc    Get all registered service providers with services & ratings
// @route   GET /api/admin/workers
// @access  Private (Admin / Super Admin)
const getWorkers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', status, category } = req.query;
    const query = { role: 'worker' };

    if (status) query.accountStatus = status;

    if (search && search.trim()) {
      const term = search.trim();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(term);
      if (isObjectId) {
        query._id = term;
      } else {
        query.$or = [
          { name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
          { phone: { $regex: term, $options: 'i' } },
        ];
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const workers = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      workers.map(async (w) => {
        const [profile, services, completedBookings, totalBookings, reviewsCount, lastModeration] =
          await Promise.all([
            WorkerProfile.findOne({ userId: w._id }).lean(),
            Service.find({ workerId: w._id }).select('title category price pricingType').lean(),
            Booking.countDocuments({ workerId: w._id, status: 'completed' }),
            Booking.countDocuments({ workerId: w._id }),
            Feedback.countDocuments({ workerId: w._id, status: 'visible' }),
            ModerationHistory.findOne({ targetUserId: w._id }).sort({ createdAt: -1 }).lean(),
          ]);

        const categories = Array.from(new Set(services.map((s) => s.category)));
        const priceRange =
          services.length > 0
            ? { min: Math.min(...services.map((s) => s.price)), max: Math.max(...services.map((s) => s.price)) }
            : null;

        return {
          ...w,
          profile,
          services,
          categories,
          priceRange,
          completedBookings,
          totalBookings,
          reviewsCount,
          rating: profile?.rating || 0,
          lastModeration,
        };
      })
    );

    // Optional category filter in memory if specified
    const filtered = category
      ? enriched.filter((w) => w.categories.some((c) => c.toLowerCase() === category.toLowerCase()))
      : enriched;

    sendResponse(res, 200, 'Service providers fetched successfully', {
      workers: filtered,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 7. FEATURE 3 & 4: USER ID SEARCH & MODERATION (SUSPEND / BLOCK / RESTORE)
// ============================================================================

// @desc    Get detailed user record by ID (Customer or Service Provider)
// @route   GET /api/admin/users/:userId/detail
// @access  Private (Admin / Super Admin)
const getUserByIdDetail = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    if (!isObjectId) return sendError(res, 400, 'Invalid User ID format. Must be a 24-character hexadecimal ID.');

    const user = await User.findById(userId).select('-password').lean();
    if (!user) return sendError(res, 404, 'User account not found with the specified ID');

    let profileData = null;
    let services = [];
    let bookings = [];
    let feedbacks = [];
    let reports = [];

    if (user.role === 'worker') {
      [profileData, services, bookings, feedbacks, reports] = await Promise.all([
        WorkerProfile.findOne({ userId: user._id }).lean(),
        Service.find({ workerId: user._id }).lean(),
        Booking.find({ workerId: user._id })
          .populate('clientId', 'name email phone')
          .populate('serviceId', 'title category price pricingType')
          .sort({ createdAt: -1 })
          .limit(30)
          .lean(),
        Feedback.find({ workerId: user._id })
          .populate('clientId', 'name')
          .populate('serviceId', 'title')
          .sort({ createdAt: -1 })
          .limit(30)
          .lean(),
        Report.find({ providerId: user._id }).populate('reporterId', 'name email').sort({ createdAt: -1 }).lean(),
      ]);
    } else if (user.role === 'client') {
      [bookings, feedbacks, reports] = await Promise.all([
        Booking.find({ clientId: user._id })
          .populate('workerId', 'name email phone')
          .populate('serviceId', 'title category price pricingType')
          .sort({ createdAt: -1 })
          .limit(30)
          .lean(),
        Feedback.find({ clientId: user._id })
          .populate('workerId', 'name')
          .populate('serviceId', 'title')
          .sort({ createdAt: -1 })
          .limit(30)
          .lean(),
        Report.find({ reporterId: user._id }).populate('providerId', 'name').sort({ createdAt: -1 }).lean(),
      ]);
    }

    const moderationHistory = await ModerationHistory.find({ targetUserId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    sendResponse(res, 200, 'User details fetched successfully', {
      user,
      profile: profileData,
      services,
      bookings,
      feedbacks,
      reports,
      moderationHistory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate user account (suspend, block, restrict, restore)
// @route   POST /api/admin/users/:userId/moderate
// @access  Private (Admin / Super Admin)
const moderateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { action, reason, duration, customDurationDays } = req.body;

    if (!['suspend', 'unsuspend', 'block', 'unblock', 'restrict', 'restore'].includes(action)) {
      return sendError(res, 400, 'Invalid moderation action specified');
    }

    // Mandatory reason for any punitive action
    if (['suspend', 'block', 'restrict'].includes(action) && (!reason || !reason.trim())) {
      return sendError(res, 400, 'A specific reason is strictly required to suspend or block an account');
    }

    const user = await User.findById(userId);
    if (!user) return sendError(res, 404, 'User account not found');

    // Security Guard: Super Admin accounts can NEVER be suspended or blocked
    if (user.role === 'super_admin') {
      return sendError(res, 403, 'Action forbidden: Super Administrator accounts cannot be suspended or blocked.');
    }

    // Security Guard: Ordinary admins cannot moderate other administrators
    if (user.role === 'admin' && req.user.role !== 'super_admin') {
      return sendError(res, 403, 'Only the Super Administrator can moderate other administrator accounts.');
    }

    const previousStatus = user.accountStatus || (user.isSuspended ? 'suspended' : 'active');
    let newStatus = 'active';
    let suspensionEndDate = null;
    let durationStr = duration || 'permanent';

    if (action === 'suspend') {
      newStatus = 'suspended';
      user.isSuspended = true;

      if (duration === '24 hours') {
        suspensionEndDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else if (duration === '3 days') {
        suspensionEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      } else if (duration === '7 days') {
        suspensionEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if (duration === '30 days') {
        suspensionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (duration === 'custom' && customDurationDays) {
        const days = Number(customDurationDays);
        durationStr = `${days} days`;
        suspensionEndDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      } else {
        durationStr = 'permanent';
      }
    } else if (action === 'block') {
      newStatus = 'blocked';
      user.isSuspended = true;
      durationStr = 'permanent';
    } else if (action === 'restrict') {
      newStatus = 'restricted';
      user.isSuspended = false;
      durationStr = duration || 'temporary';
    } else if (action === 'unsuspend' || action === 'unblock' || action === 'restore') {
      newStatus = 'active';
      user.isSuspended = false;
      durationStr = 'none';
      suspensionEndDate = null;
    }

    user.accountStatus = newStatus;
    user.suspensionReason = reason ? reason.trim() : '';
    user.suspensionDuration = durationStr;
    user.suspensionEndDate = suspensionEndDate;
    user.suspendedAt = newStatus !== 'active' ? new Date() : undefined;
    user.suspendedBy = newStatus !== 'active' ? req.user._id : undefined;

    // Immediately revoke all active sessions if suspended or blocked
    if (newStatus !== 'active') {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();

    // Record in ModerationHistory
    const historyEntry = await ModerationHistory.create({
      targetUserId: user._id,
      targetUserName: user.name,
      targetUserEmail: user.email,
      targetUserRole: user.role,
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action: action.toUpperCase(),
      reason: reason ? reason.trim() : `Account ${action}ed by admin`,
      duration: durationStr,
      startDate: new Date(),
      endDate: suspensionEndDate,
      previousStatus,
      newStatus,
    });

    // Audit Log
    await createAuditLog({
      req,
      action: `USER_${action.toUpperCase()}`,
      targetType: 'User',
      targetId: user._id,
      details: {
        targetEmail: user.email,
        targetRole: user.role,
        previousStatus,
        newStatus,
        reason,
        duration: durationStr,
      },
    });

    sendResponse(res, 200, `User account ${newStatus} successfully`, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
        suspensionDuration: user.suspensionDuration,
        suspensionEndDate: user.suspensionEndDate,
      },
      moderationEntry: historyEntry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suspension history for a specific user
// @route   GET /api/admin/users/:userId/moderation-history
// @access  Private (Admin / Super Admin)
const getUserModerationHistory = async (req, res, next) => {
  try {
    const history = await ModerationHistory.find({ targetUserId: req.params.userId }).sort({
      createdAt: -1,
    });
    sendResponse(res, 200, 'User moderation history fetched', history);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all platform moderation history
// @route   GET /api/admin/moderation-history
// @access  Private (Admin / Super Admin)
const getAllModerationHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await ModerationHistory.countDocuments();
    const history = await ModerationHistory.find()
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Moderation history fetched', {
      history,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 8. EXISTING MARKETPLACE UTILITIES (BACKWARD COMPATIBLE)
// ============================================================================

// @desc    Get all users (clients/workers)
// @route   GET /api/admin/users
// @access  Private (Super Admin or 'manage_customers' / 'manage_workers')
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const query = role ? { role } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    sendResponse(res, 200, 'Users fetched', {
      users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    if (['admin', 'super_admin'].includes(user.role)) {
      return sendError(res, 400, 'Cannot delete an administrator through standard user endpoint');
    }

    const email = user.email;
    await user.deleteOne();

    await createAuditLog({
      req,
      action: 'DELETE_USER',
      targetType: 'User',
      targetId: req.params.id,
      details: { deletedEmail: email },
    });

    sendResponse(res, 200, 'User deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Verify/approve a worker
// @route   PUT /api/admin/workers/:id/verify
// @access  Private
const verifyWorker = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    if (user.role !== 'worker') return sendError(res, 400, 'User is not a worker');

    user.isVerified = true;
    await user.save();

    await createAuditLog({
      req,
      action: 'VERIFY_WORKER',
      targetType: 'Worker',
      targetId: user._id,
      details: { workerName: user.name, workerEmail: user.email },
    });

    sendResponse(res, 200, 'Worker verified successfully', { id: user._id, isVerified: user.isVerified });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend / unsuspend a user (legacy endpoint, now updates accountStatus)
// @route   PUT /api/admin/users/:id/suspend
// @access  Private
const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    if (['admin', 'super_admin'].includes(user.role)) {
      return sendError(res, 400, 'Cannot suspend an administrator account through user endpoint');
    }

    user.isSuspended = !user.isSuspended;
    user.accountStatus = user.isSuspended ? 'suspended' : 'active';
    user.suspensionReason = req.body?.reason || (user.isSuspended ? 'Suspended by admin' : '');
    if (user.isSuspended) {
      user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate active session
    }
    await user.save();

    const action = user.isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER';
    await createAuditLog({
      req,
      action,
      targetType: 'User',
      targetId: user._id,
      details: { userEmail: user.email, isSuspended: user.isSuspended, accountStatus: user.accountStatus },
    });

    sendResponse(res, 200, `User ${user.isSuspended ? 'suspended' : 'unsuspended'}`, {
      id: user._id,
      isSuspended: user.isSuspended,
      accountStatus: user.accountStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private
const getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('clientId', 'name email phone')
      .populate('workerId', 'name email phone')
      .populate('serviceId', 'title category price pricingType')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Bookings fetched', {
      bookings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service
// @route   DELETE /api/admin/services/:id
// @access  Private
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return sendError(res, 404, 'Service not found');

    const title = service.title;
    await service.deleteOne();

    await createAuditLog({
      req,
      action: 'DELETE_SERVICE',
      targetType: 'Service',
      targetId: req.params.id,
      details: { title },
    });

    sendResponse(res, 200, 'Service deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Private
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalWorkers,
      totalClients,
      totalServices,
      totalBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      acceptedBookings,
      totalAdmins,
      totalFeedbacks,
      totalReports,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['client', 'worker'] } }),
      User.countDocuments({ role: 'worker' }),
      User.countDocuments({ role: 'client' }),
      Service.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ status: 'accepted' }),
      User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
      Feedback.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
    ]);

    // Last 7 days bookings
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = await Booking.countDocuments({ createdAt: { $gte: d, $lt: nextDay } });
      days.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), count });
    }

    sendResponse(res, 200, 'Stats fetched', {
      totalUsers,
      totalWorkers,
      totalClients,
      totalServices,
      totalBookings,
      totalAdmins,
      totalFeedbacks,
      totalReports,
      bookingsByStatus: {
        pending: pendingBookings,
        accepted: acceptedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      bookingsLast7Days: days,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user with bookings
// @route   GET /api/admin/users/:id
// @access  Private
const getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');

    const bookingQuery =
      user.role === 'worker' ? { workerId: user._id } : { clientId: user._id };

    const bookings = await Booking.find(bookingQuery)
      .populate('clientId', 'name email phone')
      .populate('workerId', 'name email phone')
      .populate('serviceId', 'title category price pricingType')
      .sort({ createdAt: -1 })
      .limit(20);

    sendResponse(res, 200, 'User detail fetched', { user, bookings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setupInitialSuperAdmin,
  getAdministrators,
  createAdministrator,
  updateAdministrator,
  toggleAdminStatus,
  revokeAdminSession,
  deleteAdministrator,
  getAdminProfile,
  updateAdminProfile,
  getAuditLogs,
  getDatabaseOverview,
  getCustomers,
  getWorkers,
  getUserByIdDetail,
  moderateUser,
  getUserModerationHistory,
  getAllModerationHistory,
  getAllUsers,
  getUserDetail,
  deleteUser,
  verifyWorker,
  suspendUser,
  getAllBookings,
  deleteService,
  getStats,
  ALL_ADMIN_PERMISSIONS,
};
