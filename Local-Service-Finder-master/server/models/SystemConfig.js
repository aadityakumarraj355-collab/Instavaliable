const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema(
  {
    isInitialSuperAdminCreated: {
      type: Boolean,
      default: false,
    },
    superAdminEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    superAdminCreatedAt: {
      type: Date,
    },
    initialSetupDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
