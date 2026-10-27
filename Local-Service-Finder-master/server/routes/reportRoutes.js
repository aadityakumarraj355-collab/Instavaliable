const express = require('express');
const router = express.Router();
const {
  createReport,
  getMyReports,
  getAdminReports,
  updateReportStatus,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { requireAdmin } = require('../middleware/permissionMiddleware');

router.post('/', protect, authorize('client'), createReport);
router.get('/my-reports', protect, authorize('client'), getMyReports);

router.get('/admin', protect, requireAdmin, getAdminReports);
router.put('/admin/:id', protect, requireAdmin, updateReportStatus);

module.exports = router;
