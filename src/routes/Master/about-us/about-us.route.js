const express = require('express');
const {
  createAboutUs,
  getAllAboutUs,
  getAboutUsById,
  updateAboutUs
} = require('../../../controllers/about-us.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new about-us entry (protected route) 2025-08-05
router.post('/create', auth, createAboutUs);

// Update about-us entry (protected route) 2025-08-05
router.put('/update', auth, updateAboutUs);

  // Get all about-us entries (public route) 2025-08-05
router.get('/', getAllAboutUs);

// Get about-us by ID (public route) 2025-08-05
router.get('/:id', getAboutUsById);

module.exports = router; 