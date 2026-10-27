const Service = require('../models/Service');
const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');

// @desc    Create service
// @route   POST /api/services
// @access  Private (worker)
const createService = async (req, res, next) => {
  try {
    // Backend Enforcement: Check if worker is suspended or blocked
    if (req.user.accountStatus && req.user.accountStatus !== 'active') {
      return sendError(
        res,
        403,
        `Cannot create service listing. Your provider account is currently ${req.user.accountStatus}.`
      );
    }

    const { title, category, description, price, pricingType, location } = req.body;
    const service = await Service.create({
      title,
      category,
      description,
      price: Number(price),
      pricingType: pricingType || 'fixed',
      location,
      workerId: req.user._id,
    });
    sendResponse(res, 201, 'Service created successfully', service);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all services (excludes services from suspended/blocked providers)
// @route   GET /api/services
// @access  Public
const getServices = async (req, res, next) => {
  try {
    const { category, location, keyword, page = 1, limit = 12 } = req.query;

    // Find all active (non-suspended, non-blocked) workers
    const activeWorkers = await User.find({
      role: 'worker',
      isSuspended: false,
      accountStatus: { $nin: ['suspended', 'blocked'] },
    }).select('_id');

    const activeWorkerIds = activeWorkers.map((w) => w._id);

    const query = {
      $or: [
        { workerId: { $in: activeWorkerIds } },
        { workerId: null }, // Seeded default services
      ],
    };

    if (category && category !== 'All') {
      query.category = { $regex: category, $options: 'i' };
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (keyword) query.$text = { $search: keyword };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .populate('workerId', 'name location isVerified phone profileImage')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    sendResponse(res, 200, 'Services fetched', {
      services,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      'workerId',
      'name location isVerified phone profileImage accountStatus'
    );
    if (!service) return sendError(res, 404, 'Service not found');
    sendResponse(res, 200, 'Service fetched', service);
  } catch (error) {
    next(error);
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (owner worker)
const updateService = async (req, res, next) => {
  try {
    // Backend Enforcement
    if (req.user.accountStatus && req.user.accountStatus !== 'active') {
      return sendError(
        res,
        403,
        `Cannot update service listing. Your provider account is currently ${req.user.accountStatus}.`
      );
    }

    const service = await Service.findById(req.params.id);
    if (!service) return sendError(res, 404, 'Service not found');

    if (service.workerId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Not authorized to update this service');
    }

    if (req.body.price !== undefined) {
      req.body.price = Number(req.body.price);
    }

    const updated = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    sendResponse(res, 200, 'Service updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (owner worker or admin)
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return sendError(res, 404, 'Service not found');

    const isOwner = service.workerId.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return sendError(res, 403, 'Not authorized to delete this service');
    }

    await service.deleteOne();
    sendResponse(res, 200, 'Service deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current worker's own services
// @route   GET /api/services/my-services
// @access  Private (worker)
const getMyServices = async (req, res, next) => {
  try {
    const services = await Service.find({ workerId: req.user._id }).sort({ createdAt: -1 });
    sendResponse(res, 200, 'My services fetched', services);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getMyServices,
};
