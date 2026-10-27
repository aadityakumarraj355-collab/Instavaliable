/**
 * Fine-grained Role & Permission Authorization Middleware
 */

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Administrator privileges required.',
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Super Admin has all permissions unconditionally
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Ordinary Admin must have explicit permission
    if (req.user.role === 'admin' && req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Missing required administrative permission: ${permission}`,
      requiredPermission: permission,
    });
  };
};

module.exports = {
  requireSuperAdmin,
  requireAdmin,
  requirePermission,
};
