const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account no longer exists' });
    }

    // Check account moderation status
    const isSuspendedOrBlocked =
      user.isSuspended ||
      ['suspended', 'blocked', 'restricted'].includes(user.accountStatus);

    if (isSuspendedOrBlocked) {
      // Check if temporary suspension duration has expired
      if (user.suspensionEndDate && new Date() > new Date(user.suspensionEndDate)) {
        // Auto-restore
        user.accountStatus = 'active';
        user.isSuspended = false;
        user.suspensionReason = '';
        user.suspensionDuration = '';
        user.suspensionEndDate = undefined;
        await user.save();
      } else {
        const statusType = user.accountStatus || (user.isSuspended ? 'suspended' : 'blocked');
        const reason = user.suspensionReason ? ` Reason: ${user.suspensionReason}` : '';
        const duration = user.suspensionDuration ? ` (Duration: ${user.suspensionDuration})` : '';

        return res.status(403).json({
          success: false,
          accountStatus: statusType,
          message: `Your account has been ${statusType} by administration.${reason}${duration}. Access to protected marketplace features is restricted.`,
        });
      }
    }

    // Verify session validity (revocation check)
    const expectedTokenVersion = user.tokenVersion || 0;
    const tokenVersionInJwt = decoded.tokenVersion || 0;
    if (tokenVersionInJwt !== expectedTokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Session has been revoked or expired. Please sign in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid or expired session token',
    });
  }
};

module.exports = { protect };
