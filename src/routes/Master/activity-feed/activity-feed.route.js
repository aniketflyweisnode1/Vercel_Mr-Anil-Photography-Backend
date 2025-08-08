const express = require('express');
const {
  getActivityFeedById,
  getAllActivityFeed
} = require('../../../controllers/activity-feed.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Get activity feed by ID (protected route) 2025-08-06
router.get('/:id', auth, getActivityFeedById);

// Get all activity feeds with pagination and filtering (protected route) 2025-08-06
router.get('/', auth, getAllActivityFeed);

module.exports = router; 