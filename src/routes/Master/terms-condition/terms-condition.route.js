const express = require('express');
const {
  createTermsCondition,
  getAllTermsCondition,
  getTermsConditionById,
  updateTermsCondition
} = require('../../../controllers/terms-condition.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new terms-condition entry (protected route) 2025-08-05
router.post('/create', auth, createTermsCondition);

// Update terms-condition entry (protected route) 2025-08-05
router.put('/update', auth, updateTermsCondition);

// Get all terms-condition entries (public route) 2025-08-05
router.get('/', getAllTermsCondition);

// Get terms-condition by ID (public route) 2025-08-05
router.get('/:id', getTermsConditionById);

module.exports = router; 