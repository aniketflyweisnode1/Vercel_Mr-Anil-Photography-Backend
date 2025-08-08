const express = require('express');
const {
  createHyperGuidelines,
  getAllHyperGuidelines,
  getHyperGuidelinesById,
  updateHyperGuidelines
} = require('../../../controllers/hyper-guidelines.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new hyper-guidelines entry (protected route) 2025-08-05
router.post('/create', auth, createHyperGuidelines);

// Update hyper-guidelines entry (protected route) 2025-08-05
router.put('/update', auth, updateHyperGuidelines);

// Get all hyper-guidelines entries (public route) 2025-08-05
router.get('/', getAllHyperGuidelines);

// Get hyper-guidelines by ID (public route) 2025-08-05
router.get('/:id', getHyperGuidelinesById);

module.exports = router; 