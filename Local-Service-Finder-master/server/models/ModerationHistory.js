const mongoose = require('mongoose');

const moderationHistorySchema = new mongoose.Schema(
  {
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetUserName: { type: String, required: true },
    targetUserEmail: { type: String, required: true },
    targetUserRole: {
      type: String,
      enum: ['client', 'worker', 'admin'],
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true },
    action: {
      type: String,
      enum: ['SUSPEND', 'UNSUSPEND', 'BLOCK', 'UNBLOCK', 'RESTRICT', 'RESTORE'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      default: 'permanent',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    previousStatus: {
      type: String,
      required: true,
    },
    newStatus: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ModerationHistory', moderationHistorySchema);
