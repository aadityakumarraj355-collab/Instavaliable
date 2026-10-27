const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createBooking, getBookings, getBooking, updateBookingStatus, cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');

router.get('/', protect, getBookings);
router.get('/:id', protect, getBooking);

router.post(
  '/',
  protect,
  authorize('client'),
  [
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
  ],
  validate,
  createBooking
);

router.put(
  '/:id/status',
  protect,
  authorize('worker'),
  [body('status').isIn(['accepted', 'rejected', 'completed']).withMessage('Invalid status')],
  validate,
  updateBookingStatus
);

router.put('/:id/cancel', protect, authorize('client'), cancelBooking);

module.exports = router;
