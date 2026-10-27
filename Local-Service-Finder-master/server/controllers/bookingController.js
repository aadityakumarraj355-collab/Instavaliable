const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private (client)
const createBooking = async (req, res, next) => {
  try {
    const { serviceId, date, scheduledTime, address, phone, notes } = req.body;

    // Backend Enforcement: Check client account status
    if (req.user.accountStatus && req.user.accountStatus !== 'active') {
      return sendError(
        res,
        403,
        `Cannot create booking. Your account is currently ${req.user.accountStatus}.`
      );
    }

    const service = await Service.findById(serviceId).populate('workerId', 'name accountStatus isSuspended');
    if (!service) return sendError(res, 404, 'Service not found');

    // Backend Enforcement: Check if service provider is suspended or blocked
    const provider = service.workerId;
    if (provider && (provider.isSuspended || (provider.accountStatus && provider.accountStatus !== 'active'))) {
      return sendError(res, 400, 'This service professional is currently not accepting bookings due to account moderation.');
    }

    if (service.workerId._id.toString() === req.user._id.toString()) {
      return sendError(res, 400, 'You cannot book your own service');
    }

    const booking = await Booking.create({
      clientId: req.user._id,
      workerId: service.workerId._id,
      serviceId,
      date,
      scheduledTime,
      address,
      phone,
      notes,
    });

    // Populate for real-time push
    const populated = await Booking.findById(booking._id)
      .populate('clientId', 'name email')
      .populate('workerId', 'name email')
      .populate('serviceId', 'title category price pricingType');

    // Notify worker in real-time with full booking data
    const io = req.app.get('io');
    if (io) {
      io.to(service.workerId._id.toString()).emit('new_booking', {
        message: `New booking request ${populated.requestId ? `[${populated.requestId}]` : ''} for "${service.title}"`,
        bookingId: booking._id,
        requestId: populated.requestId,
        booking: populated,
      });
    }

    sendResponse(res, 201, 'Booking created', populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings (role-based)
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    let query = {};

    if (req.user.role === 'client') query.clientId = req.user._id;
    else if (req.user.role === 'worker') query.workerId = req.user._id;

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('clientId', 'name email phone')
      .populate('workerId', 'name email phone')
      .populate('serviceId', 'title category price pricingType')
      .populate('feedbackId')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Bookings fetched', {
      bookings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('clientId', 'name email phone')
      .populate('workerId', 'name email phone')
      .populate('serviceId', 'title category price pricingType')
      .populate('feedbackId');

    if (!booking) return sendError(res, 404, 'Booking not found');

    const isClient = booking.clientId._id.toString() === req.user._id.toString();
    const isWorker = booking.workerId._id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (!isClient && !isWorker && !isAdmin) {
      return sendError(res, 403, 'Not authorized to view this booking');
    }

    sendResponse(res, 200, 'Booking fetched', booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (accept/reject/complete)
// @route   PUT /api/bookings/:id/status
// @access  Private (worker)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['accepted', 'rejected', 'completed'];

    // Backend Enforcement: Check provider account status
    if (req.user.accountStatus && req.user.accountStatus !== 'active') {
      return sendError(
        res,
        403,
        `Cannot update booking. Your provider account is currently ${req.user.accountStatus}.`
      );
    }

    if (!allowedStatuses.includes(status)) {
      return sendError(res, 400, `Status must be one of: ${allowedStatuses.join(', ')}`);
    }

    const booking = await Booking.findById(req.params.id).populate('clientId', 'name');
    if (!booking) return sendError(res, 404, 'Booking not found');

    if (booking.workerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to update this booking');
    }

    if (booking.status === 'cancelled') {
      return sendError(res, 400, 'Cannot update a cancelled booking');
    }

    booking.status = status;
    await booking.save();

    // Notify client in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(booking.clientId._id.toString()).emit('booking_status', {
        message: `Your booking request [${booking.requestId || booking._id}] has been marked as ${status}`,
        bookingId: booking._id,
        requestId: booking.requestId,
        status,
      });
    }

    sendResponse(res, 200, 'Booking status updated', booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (client)
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 404, 'Booking not found');

    if (booking.clientId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to cancel this booking');
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return sendError(res, 400, `Cannot cancel a ${booking.status} booking`);
    }

    booking.status = 'cancelled';
    await booking.save();

    sendResponse(res, 200, 'Booking cancelled', booking);
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getBookings, getBooking, updateBookingStatus, cancelBooking };
