const express = require('express');
const router = express.Router();
const {
  getActiveWhatsAppContacts,
  getAllContacts,
  createContact,
  updateContact,
  setPrimaryContact,
  toggleContactStatus,
  deleteContact,
} = require('../controllers/whatsAppController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

// Public route to get current active WhatsApp numbers for customer & provider click-to-chat
router.get('/active', getActiveWhatsAppContacts);

// Protected routes for WhatsApp contact management (Super Admin or 'manage_whatsapp')
router.use('/admin', protect, requirePermission('manage_whatsapp'));

router.get('/admin/contacts', getAllContacts);
router.post('/admin/contacts', createContact);
router.put('/admin/contacts/:id', updateContact);
router.put('/admin/contacts/:id/primary', setPrimaryContact);
router.put('/admin/contacts/:id/status', toggleContactStatus);
router.delete('/admin/contacts/:id', deleteContact);

module.exports = router;
