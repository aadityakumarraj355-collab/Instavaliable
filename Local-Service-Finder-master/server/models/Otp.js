const mongoose = require('mongoose');
const crypto = require('crypto');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['password_reset', 'password_change', 'email_verification', 'sensitive_action'],
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically purged by MongoDB TTL when expired
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash an OTP string using SHA-256
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP and save its SHA-256 hash.
 * Invalidates any existing unused OTP for this email and purpose.
 * Default validity: 5 minutes.
 */
otpSchema.statics.generateAndSaveOtp = async function ({ email, purpose, validityMinutes = 5 }) {
  const normalizedEmail = email.toLowerCase().trim();

  // Invalidate any previous OTPs for this email and purpose
  await this.deleteMany({ email: normalizedEmail, purpose });

  // Generate cryptographically random 6-digit code (100000 to 999999)
  const plainOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(plainOtp);
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

  await this.create({
    email: normalizedEmail,
    otpHash,
    purpose,
    expiresAt,
    attempts: 0,
    maxAttempts: 5,
    isUsed: false,
  });

  return plainOtp;
};

/**
 * Verify an entered OTP against the stored SHA-256 hash
 */
otpSchema.statics.verifyOtp = async function ({ email, enteredOtp, purpose }) {
  const normalizedEmail = email.toLowerCase().trim();
  const record = await this.findOne({
    email: normalizedEmail,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (!record) {
    return {
      success: false,
      message: 'No active OTP request found or the verification code has already expired.',
    };
  }

  // Check if expired
  if (new Date() > new Date(record.expiresAt)) {
    await record.deleteOne();
    return {
      success: false,
      message: 'This OTP has expired. Please request a new verification code.',
    };
  }

  // Check if maximum attempts exceeded (brute-force defense)
  if (record.attempts >= record.maxAttempts) {
    await record.deleteOne();
    return {
      success: false,
      message: 'Too many incorrect attempts. This OTP has been invalidated for security. Please request a new one.',
    };
  }

  // Verify hash
  const inputHash = hashOtp(enteredOtp);
  if (inputHash !== record.otpHash) {
    record.attempts += 1;
    await record.save();
    const remaining = record.maxAttempts - record.attempts;
    return {
      success: false,
      message: remaining > 0
        ? `Invalid OTP code. You have ${remaining} attempt(s) remaining.`
        : 'Too many incorrect attempts. This OTP has been invalidated.',
    };
  }

  // Mark as used and delete to prevent reuse
  record.isUsed = true;
  await record.save();
  await this.deleteMany({ email: normalizedEmail, purpose });

  return {
    success: true,
    message: 'OTP successfully verified.',
  };
};

module.exports = mongoose.model('Otp', otpSchema);
