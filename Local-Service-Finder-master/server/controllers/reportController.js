const Report = require('../models/Report');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLogger');

// @desc    Submit a report against a service provider
// @route   POST /api/reports
// @access  Private (client)
const createReport = async (req, res, next) => {
  try {
    const { providerId, bookingId, category, description } = req.body;

    if (!providerId) return sendError(res, 400, 'Provider ID is required');
    if (!category) return sendError(res, 400, 'Report category is required');
    if (!description || description.trim().length < 10) {
      return sendError(res, 400, 'Please provide a detailed description (min 10 characters)');
    }

    const provider = await User.findById(providerId);
    if (!provider || provider.role !== 'worker') {
      return sendError(res, 404, 'Service provider not found');
    }

    // Optional booking association check
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking || booking.clientId.toString() !== req.user._id.toString()) {
        return sendError(res, 400, 'Invalid booking associated with this report');
      }
    }

    const report = await Report.create({
      reporterId: req.user._id,
      providerId,
      bookingId: bookingId || null,
      category,
      description: description.trim(),
      status: 'pending',
    });

    sendResponse(res, 201, 'Report submitted successfully. Our safety and moderation team will review it.', report);
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's own reports
// @route   GET /api/reports/my-reports
// @access  Private (client)
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id })
      .populate('providerId', 'name email phone')
      .populate('bookingId', 'requestId date')
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Your reports fetched', reports);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all reports
// @route   GET /api/reports/admin
// @access  Private (Admin / Super Admin)
const getAdminReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('reporterId', 'name email phone')
      .populate('providerId', 'name email phone accountStatus isSuspended')
      .populate('bookingId', 'requestId date')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Admin reports fetched', {
      reports,
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

// @desc    Admin: Update report status / investigation notes
// @route   PUT /api/reports/admin/:id
// @access  Private (Admin / Super Admin)
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return sendError(res, 404, 'Report not found');

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes.trim();
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();

    await createAuditLog({
      req,
      action: 'UPDATE_PROVIDER_REPORT',
      targetType: 'Report',
      targetId: report._id,
      details: {
        providerId: report.providerId,
        newStatus: report.status,
        adminNotes: report.adminNotes,
      },
    });

    sendResponse(res, 200, 'Report updated successfully', report);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getMyReports,
  getAdminReports,
  updateReportStatus,
};
