const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getMyFeedback,
  getProviderFeedback,
  getWorkerReviews,
  getAdminFeedbacks,
  moderateFeedback,
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { requireAdmin } = require('../middleware/permissionMiddleware');

// Public route: Get feedback for a provider
router.get('/provider/:providerId', getProviderFeedback);

// Client routes
router.post('/', protect, authorize('client'), submitFeedback);
router.get('/my-feedback', protect, authorize('client'), getMyFeedback);

// Worker reviews dashboard
router.get('/worker/my-reviews', protect, authorize('worker'), getWorkerReviews);

// Admin feedback moderation
router.get('/admin', protect, requireAdmin, getAdminFeedbacks);
router.put('/admin/:id/moderate', protect, requireAdmin, moderateFeedback);

module.exports = router;
