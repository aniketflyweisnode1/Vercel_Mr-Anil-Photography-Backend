const express = require('express');
const {
  createFAQ,
  getAllFAQ,
  getFAQById,
  updateFAQ
} = require('../../../controllers/faq.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new FAQ entry (protected route) 2025-08-05
router.post('/create', auth, createFAQ);

// Update FAQ entry (protected route) 2025-08-05
router.put('/update', auth, updateFAQ);

// Get all FAQ entries (public route) 2025-08-05
router.get('/', getAllFAQ);

// Get FAQ by ID (public route) 2025-08-05
router.get('/:id', getFAQById);

module.exports = router; 