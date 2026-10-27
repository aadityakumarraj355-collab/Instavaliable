const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile, getWorkerById } = require('../controllers/workerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/profile', protect, authorize('worker'), getMyProfile);
router.put('/profile', protect, authorize('worker'), updateMyProfile);
router.get('/:id', getWorkerById);

module.exports = router;
