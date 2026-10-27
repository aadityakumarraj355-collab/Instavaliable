const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      index: true,
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: Date, required: true },
    scheduledTime: { type: String }, // e.g. "09:00 AM"
    address: { type: String },
    phone: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    hasFeedback: {
      type: Boolean,
      default: false,
    },
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
    },
  },
  { timestamps: true }
);

// Auto-generate requestId in format INS-YYYY-XXXXXX (e.g. INS-2026-000123)
bookingSchema.pre('save', async function (next) {
  if (!this.requestId) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.requestId = `INS-${year}-${randomSuffix}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
