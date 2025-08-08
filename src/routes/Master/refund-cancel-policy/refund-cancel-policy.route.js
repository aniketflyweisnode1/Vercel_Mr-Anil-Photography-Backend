const express = require('express');
const {
  createRefundCancelPolicy,
  getAllRefundCancelPolicy,
  getRefundCancelPolicyById,
  updateRefundCancelPolicy
} = require('../../../controllers/refund-cancel-policy.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new refund-cancel-policy entry (protected route) 2025-08-05
router.post('/create', auth, createRefundCancelPolicy);

// Update refund-cancel-policy entry (protected route) 2025-08-05
router.put('/update', auth, updateRefundCancelPolicy);

// Get all refund-cancel-policy entries (public route) 2025-08-05
router.get('/', getAllRefundCancelPolicy);

// Get refund-cancel-policy by ID (public route) 2025-08-05
router.get('/:id', getRefundCancelPolicyById);

module.exports = router; 