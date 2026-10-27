const WhatsAppContact = require('../models/WhatsAppContact');
const { sendResponse, sendError } = require('../utils/response');
const { createAuditLog } = require('../utils/auditLogger');

// @desc    Get public active WhatsApp contacts for click-to-chat routing
// @route   GET /api/whatsapp/active
// @access  Public
const getActiveWhatsAppContacts = async (req, res, next) => {
  try {
    const contacts = await WhatsAppContact.find({ isActive: true }).sort({ isPrimary: -1, createdAt: 1 });
    const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0] || null;

    sendResponse(res, 200, 'Active WhatsApp contacts fetched', {
      primaryNumber: primaryContact?.phoneNumber || process.env.WHATSAPP_BUSINESS_NUMBER || '+1234567890',
      primaryContact,
      allContacts: contacts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all WhatsApp contacts for Admin
// @route   GET /api/whatsapp/admin/contacts
// @access  Private (manage_whatsapp or Super Admin)
const getAllContacts = async (req, res, next) => {
  try {
    const contacts = await WhatsAppContact.find()
      .populate('createdBy', 'name email')
      .sort({ isPrimary: -1, createdAt: -1 });

    sendResponse(res, 200, 'All WhatsApp contacts fetched', contacts);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new WhatsApp contact
// @route   POST /api/whatsapp/admin/contacts
// @access  Private (manage_whatsapp or Super Admin)
const createContact = async (req, res, next) => {
  try {
    const { name, phoneNumber, category = 'general', isPrimary = false, notes } = req.body;

    if (!name || !phoneNumber) {
      return sendError(res, 400, 'Name and phone number are required');
    }

    // If marked primary, unset other primary contacts in same category or globally
    if (isPrimary) {
      await WhatsAppContact.updateMany({ isPrimary: true }, { isPrimary: false });
    }

    const contact = await WhatsAppContact.create({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      category,
      isPrimary: Boolean(isPrimary),
      isActive: true,
      notes: notes ? notes.trim() : '',
      createdBy: req.user._id,
    });

    await createAuditLog({
      req,
      action: 'CREATE_WHATSAPP_CONTACT',
      targetType: 'WhatsAppContact',
      targetId: contact._id,
      details: { name: contact.name, phoneNumber: contact.phoneNumber, category: contact.category },
    });

    sendResponse(res, 201, 'WhatsApp contact created successfully', contact);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a WhatsApp contact
// @route   PUT /api/whatsapp/admin/contacts/:id
// @access  Private (manage_whatsapp or Super Admin)
const updateContact = async (req, res, next) => {
  try {
    const { name, phoneNumber, category, notes, isActive } = req.body;
    const contact = await WhatsAppContact.findById(req.params.id);

    if (!contact) return sendError(res, 404, 'WhatsApp contact not found');

    if (name) contact.name = name.trim();
    if (phoneNumber) contact.phoneNumber = phoneNumber.trim();
    if (category) contact.category = category;
    if (notes !== undefined) contact.notes = notes.trim();
    if (isActive !== undefined) contact.isActive = Boolean(isActive);

    await contact.save();

    await createAuditLog({
      req,
      action: 'UPDATE_WHATSAPP_CONTACT',
      targetType: 'WhatsAppContact',
      targetId: contact._id,
      details: { name: contact.name, phoneNumber: contact.phoneNumber },
    });

    sendResponse(res, 200, 'WhatsApp contact updated successfully', contact);
  } catch (error) {
    next(error);
  }
};

// @desc    Set WhatsApp contact as primary
// @route   PUT /api/whatsapp/admin/contacts/:id/primary
// @access  Private (manage_whatsapp or Super Admin)
const setPrimaryContact = async (req, res, next) => {
  try {
    const contact = await WhatsAppContact.findById(req.params.id);
    if (!contact) return sendError(res, 404, 'WhatsApp contact not found');

    // Unset current primary
    await WhatsAppContact.updateMany({}, { isPrimary: false });

    contact.isPrimary = true;
    contact.isActive = true; // Primary must be active
    await contact.save();

    await createAuditLog({
      req,
      action: 'SET_PRIMARY_WHATSAPP_CONTACT',
      targetType: 'WhatsAppContact',
      targetId: contact._id,
      details: { name: contact.name, phoneNumber: contact.phoneNumber },
    });

    sendResponse(res, 200, `"${contact.name}" is now the primary WhatsApp contact`, contact);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle contact active status
// @route   PUT /api/whatsapp/admin/contacts/:id/status
// @access  Private (manage_whatsapp or Super Admin)
const toggleContactStatus = async (req, res, next) => {
  try {
    const contact = await WhatsAppContact.findById(req.params.id);
    if (!contact) return sendError(res, 404, 'WhatsApp contact not found');

    if (contact.isPrimary && contact.isActive) {
      return sendError(res, 400, 'Cannot deactivate the primary WhatsApp contact. Please designate another primary contact first.');
    }

    contact.isActive = !contact.isActive;
    await contact.save();

    await createAuditLog({
      req,
      action: contact.isActive ? 'ACTIVATE_WHATSAPP_CONTACT' : 'DEACTIVATE_WHATSAPP_CONTACT',
      targetType: 'WhatsAppContact',
      targetId: contact._id,
      details: { name: contact.name, isActive: contact.isActive },
    });

    sendResponse(res, 200, `Contact ${contact.isActive ? 'activated' : 'deactivated'}`, contact);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete WhatsApp contact
// @route   DELETE /api/whatsapp/admin/contacts/:id
// @access  Private (manage_whatsapp or Super Admin)
const deleteContact = async (req, res, next) => {
  try {
    const contact = await WhatsAppContact.findById(req.params.id);
    if (!contact) return sendError(res, 404, 'WhatsApp contact not found');

    if (contact.isPrimary) {
      return sendError(res, 400, 'Cannot delete the primary WhatsApp contact. Designate another contact as primary first.');
    }

    const name = contact.name;
    await contact.deleteOne();

    await createAuditLog({
      req,
      action: 'DELETE_WHATSAPP_CONTACT',
      targetType: 'WhatsAppContact',
      targetId: req.params.id,
      details: { deletedContactName: name },
    });

    sendResponse(res, 200, 'WhatsApp contact deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveWhatsAppContacts,
  getAllContacts,
  createContact,
  updateContact,
  setPrimaryContact,
  toggleContactStatus,
  deleteContact,
};
