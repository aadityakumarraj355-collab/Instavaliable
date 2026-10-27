const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills: [{ type: String, trim: true }],
    experience: { type: String },
    bio: { type: String },
    hourlyRate: { type: Number, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    location: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
