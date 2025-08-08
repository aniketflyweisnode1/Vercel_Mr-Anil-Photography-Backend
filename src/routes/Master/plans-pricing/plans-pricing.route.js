const express = require('express');
const {
  createPlansPricing,
  getAllPlansPricing,
  getPlansPricingById,
  updatePlansPricing
} = require('../../../controllers/plans-pricing.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new plans-pricing entry (protected route) 2025-08-05
router.post('/create', auth, createPlansPricing);

// Update plans-pricing entry (protected route) 2025-08-05
router.put('/update', auth, updatePlansPricing);

// Get all plans-pricing entries (public route) 2025-08-05
router.get('/', getAllPlansPricing);

// Get plans-pricing by ID (public route) 2025-08-05
router.get('/:id', getPlansPricingById);

module.exports = router; 