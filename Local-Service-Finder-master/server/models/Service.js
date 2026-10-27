const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    pricingType: {
      type: String,
      enum: ['fixed', 'starting_at', 'hourly', 'per_visit', 'custom_quote'],
      default: 'fixed',
    },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    location: { type: String, trim: true },
  },
  { timestamps: true }
);

// Text index for keyword search
serviceSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Service', serviceSchema);
