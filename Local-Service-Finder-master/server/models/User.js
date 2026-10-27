const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['client', 'worker', 'admin', 'super_admin'],
      default: 'client',
    },
    permissions: {
      type: [String],
      default: [],
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    profileImage: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    location: { type: String, trim: true },
    phone: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },

    // Account Moderation & Suspension Fields
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'blocked', 'restricted'],
      default: 'active',
      index: true,
    },
    isSuspended: { type: Boolean, default: false, index: true },
    suspensionReason: { type: String, default: '' },
    suspensionDuration: { type: String, default: '' }, // e.g. '24 hours', '3 days', '7 days', '30 days', 'permanent'
    suspensionEndDate: { type: Date },
    suspendedAt: { type: Date },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    lastIp: { type: String },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  // Sync isSuspended flag with accountStatus
  if (this.isModified('accountStatus')) {
    this.isSuspended = this.accountStatus !== 'active';
  } else if (this.isModified('isSuspended')) {
    this.accountStatus = this.isSuspended ? 'suspended' : 'active';
  }

  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
