const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const WorkerProfile = require('../models/WorkerProfile');
const { sendResponse, sendError } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLogger');

// Helper to recalculate and cache worker rating
async function updateWorkerRatingCache(workerId) {
  try {
    const feedbacks = await Feedback.find({ workerId, status: 'visible' });
    const count = feedbacks.length;
    const avg = count > 0 ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / count : 0;

    await WorkerProfile.findOneAndUpdate(
      { userId: workerId },
      { rating: Math.round(avg * 10) / 10, ratingCount: count },
      { upsert: true }
    );
  } catch (err) {
    console.error('Error updating worker rating cache:', err.message);
  }
}

// @desc    Submit feedback for a completed booking
// @route   POST /api/feedback
// @access  Private (client only)
const submitFeedback = async (req, res, next) => {
  try {
    const { bookingId, rating, message } = req.body;

    if (!bookingId) return sendError(res, 400, 'Booking ID is required');
    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Rating must be an integer between 1 and 5 stars');
    }
    if (!message || message.trim().length < 3) {
      return sendError(res, 400, 'Feedback message must be at least 3 characters long');
    }

    // 1. Fetch booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return sendError(res, 404, 'Booking not found');

    // 2. Eligibility Rule: Customer must own the booking
    if (booking.clientId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'You can only submit feedback for your own bookings');
    }

    // 3. Eligibility Rule: Booking must be completed
    if (booking.status !== 'completed') {
      return sendError(
        res,
        400,
        `Feedback can only be submitted for completed services. This booking is currently "${booking.status}".`
      );
    }

    // 4. Eligibility Rule: Prevent duplicate feedback
    const existingFeedback = await Feedback.findOne({ bookingId });
    if (existingFeedback) {
      return sendError(res, 400, 'You have already submitted feedback for this completed booking');
    }

    // 5. Create Feedback
    const feedback = await Feedback.create({
      bookingId,
      clientId: req.user._id,
      workerId: booking.workerId,
      serviceId: booking.serviceId,
      rating: Math.floor(rating),
      message: message.trim(),
      status: 'visible',
    });

    // Link feedback to booking
    booking.hasFeedback = true;
    booking.feedbackId = feedback._id;
    await booking.save();

    // Recalculate worker rating
    await updateWorkerRatingCache(booking.workerId);

    sendResponse(res, 201, 'Feedback submitted successfully', feedback);
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's own submitted feedbacks
// @route   GET /api/feedback/my-feedback
// @access  Private (client)
const getMyFeedback = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ clientId: req.user._id })
      .populate('workerId', 'name email phone profileImage')
      .populate('serviceId', 'title category price pricingType')
      .populate('bookingId', 'requestId date scheduledTime')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Customer feedbacks fetched', feedbacks);
  } catch (error) {
    next(error);
  }
};

// @desc    Get visible reviews for a service provider (Public or Worker)
// @route   GET /api/feedback/provider/:providerId
// @access  Public
const getProviderFeedback = async (req, res, next) => {
  try {
    const { providerId } = req.params;
    const feedbacks = await Feedback.find({ workerId: providerId, status: 'visible' })
      .populate('clientId', 'name profileImage')
      .populate('serviceId', 'title category')
      .populate('bookingId', 'requestId date')
      .sort({ createdAt: -1 });

    const total = feedbacks.length;
    const avgRating = total > 0 ? (feedbacks.reduce((a, b) => a + b.rating, 0) / total).toFixed(1) : '0.0';

    // Rating breakdown distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((f) => {
      if (distribution[f.rating] !== undefined) distribution[f.rating]++;
    });

    sendResponse(res, 200, 'Provider feedback fetched', {
      total,
      averageRating: parseFloat(avgRating),
      distribution,
      feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get service provider's own reviews dashboard
// @route   GET /api/feedback/worker/my-reviews
// @access  Private (worker)
const getWorkerReviews = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ workerId: req.user._id })
      .populate('clientId', 'name')
      .populate('serviceId', 'title category price pricingType')
      .populate('bookingId', 'requestId date scheduledTime')
      .sort({ createdAt: -1 });

    const visibleFeedbacks = feedbacks.filter((f) => f.status === 'visible');
    const total = visibleFeedbacks.length;
    const avgRating =
      total > 0 ? (visibleFeedbacks.reduce((a, b) => a + b.rating, 0) / total).toFixed(1) : '0.0';

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    visibleFeedbacks.forEach((f) => {
      if (distribution[f.rating] !== undefined) distribution[f.rating]++;
    });

    sendResponse(res, 200, 'Worker reviews fetched', {
      total,
      averageRating: parseFloat(avgRating),
      distribution,
      feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all feedback with filters and search
// @route   GET /api/feedback/admin
// @access  Private (Admin / Super Admin)
const getAdminFeedbacks = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, search = '', status } = req.query;
    const query = {};

    if (status) query.status = status;

    // Search by ObjectId if valid MongoDB ObjectId
    if (search && search.trim()) {
      const term = search.trim();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(term);
      if (isObjectId) {
        query.$or = [
          { _id: term },
          { bookingId: term },
          { clientId: term },
          { workerId: term },
        ];
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Feedback.countDocuments(query);
    const feedbacks = await Feedback.find(query)
      .populate('clientId', 'name email phone')
      .populate('workerId', 'name email phone')
      .populate('serviceId', 'title category price')
      .populate('bookingId', 'requestId date status')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Admin feedbacks fetched', {
      feedbacks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Moderate feedback (Hide or Flag with reason)
// @route   PUT /api/feedback/admin/:id/moderate
// @access  Private (Admin / Super Admin)
const moderateFeedback = async (req, res, next) => {
  try {
    const { status, moderationReason } = req.body;

    if (!['visible', 'hidden', 'flagged'].includes(status)) {
      return sendError(res, 400, 'Invalid status. Must be visible, hidden, or flagged.');
    }

    if (status === 'hidden' && (!moderationReason || !moderationReason.trim())) {
      return sendError(res, 400, 'A valid moderation reason is required to hide feedback.');
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return sendError(res, 404, 'Feedback not found');

    const previousStatus = feedback.status;
    feedback.status = status;
    feedback.moderationReason = moderationReason ? moderationReason.trim() : '';
    feedback.moderatedBy = req.user._id;
    feedback.moderatedAt = new Date();
    await feedback.save();

    // Recalculate worker rating since visibility changed
    await updateWorkerRatingCache(feedback.workerId);

    // Audit log
    await createAuditLog({
      req,
      action: 'MODERATE_FEEDBACK',
      targetType: 'Feedback',
      targetId: feedback._id,
      details: {
        bookingId: feedback.bookingId,
        workerId: feedback.workerId,
        previousStatus,
        newStatus: status,
        moderationReason: feedback.moderationReason,
      },
    });

    sendResponse(res, 200, `Feedback status updated to ${status}`, feedback);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitFeedback,
  getMyFeedback,
  getProviderFeedback,
  getWorkerReviews,
  getAdminFeedbacks,
  moderateFeedback,
};
