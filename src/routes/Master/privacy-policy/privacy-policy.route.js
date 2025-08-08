const express = require('express');
const {
  createPrivacyPolicy,
  getAllPrivacyPolicy,
  getPrivacyPolicyById,
  updatePrivacyPolicy
} = require('../../../controllers/privacy-policy.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new privacy-policy entry (protected route) 2025-08-05
router.post('/create', auth, createPrivacyPolicy);

// Update privacy-policy entry (protected route) 2025-08-05
router.put('/update', auth, updatePrivacyPolicy);

// Get all privacy-policy entries (public route) 2025-08-05
router.get('/', getAllPrivacyPolicy);

// Get privacy-policy by ID (public route) 2025-08-05
router.get('/:id', getPrivacyPolicyById);

module.exports = router; 