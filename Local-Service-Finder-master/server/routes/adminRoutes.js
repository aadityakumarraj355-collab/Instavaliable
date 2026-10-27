const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const {
  requireSuperAdmin,
  requireAdmin,
  requirePermission,
} = require('../middleware/permissionMiddleware');

// 1. Initial Setup Endpoint (Protected by ADMIN_SETUP_SECRET, locked once created)
router.post('/setup-initial-super-admin', setupInitialSuperAdmin);

// 2. All subsequent admin endpoints require authentication + administrator role
router.use(protect, requireAdmin);

// Profile Management (Self)
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

// Overall Platform Statistics
router.get('/stats', getStats);

// 3. Super Admin Only — Administrator Accounts & Permission Management
router.get('/administrators', requireSuperAdmin, getAdministrators);
router.post('/administrators', requireSuperAdmin, createAdministrator);
router.put('/administrators/:id', requireSuperAdmin, updateAdministrator);
router.put('/administrators/:id/status', requireSuperAdmin, toggleAdminStatus);
router.post('/administrators/:id/revoke-sessions', requireSuperAdmin, revokeAdminSession);
router.delete('/administrators/:id', requireSuperAdmin, deleteAdministrator);

// 4. Feature 1 & 2: Dedicated Customer & Service Provider Management
router.get('/customers', requirePermission('manage_customers'), getCustomers);
router.get('/workers', requirePermission('manage_workers'), getWorkers);

// 5. Feature 3 & 4: User ID Search & Account Moderation (Suspend / Block / Restore)
router.get('/users/:userId/detail', getUserByIdDetail);
router.post('/users/:userId/moderate', moderateUser);
router.get('/users/:userId/moderation-history', getUserModerationHistory);
router.get('/moderation-history', getAllModerationHistory);

// Legacy User Management (Preserved)
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetail);
router.delete('/users/:id', requirePermission('manage_customers'), deleteUser);
router.put('/users/:id/suspend', requirePermission('manage_customers'), suspendUser);
router.put('/workers/:id/verify', requirePermission('manage_workers'), verifyWorker);

router.get('/bookings', requirePermission('manage_bookings'), getAllBookings);
router.delete('/services/:id', requirePermission('manage_services'), deleteService);

// 6. System Audit Trail & Database Health
router.get('/audit-logs', requirePermission('view_audit_logs'), getAuditLogs);
router.get('/database/overview', requirePermission('manage_database'), getDatabaseOverview);

module.exports = router;
