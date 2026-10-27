const AuditLog = require('../models/AuditLog');

async function createAuditLog({ req, action, targetType, targetId, details }) {
  try {
    const ipAddress =
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      'internal';

    await AuditLog.create({
      actorId: req?.user?._id || null,
      actorName: req?.user?.name || 'System / Setup Process',
      actorEmail: req?.user?.email || 'system',
      actorRole: req?.user?.role || 'system',
      action,
      targetType,
      targetId: targetId ? String(targetId) : undefined,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Audit log write error:', error.message);
  }
}

module.exports = { createAuditLog };
