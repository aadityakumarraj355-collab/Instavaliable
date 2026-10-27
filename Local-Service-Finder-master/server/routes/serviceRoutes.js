const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getMyServices,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');

const serviceValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];

router.get('/', getServices);
router.get('/my-services', protect, authorize('worker'), getMyServices);
router.get('/:id', getService);
router.post('/', protect, authorize('worker'), serviceValidation, validate, createService);
router.put('/:id', protect, authorize('worker'), updateService);
router.delete('/:id', protect, authorize('worker', 'admin', 'super_admin'), deleteService);

module.exports = router;
