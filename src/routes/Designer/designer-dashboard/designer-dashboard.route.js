const express = require('express');
const {
  getDesignerDashboard
} = require('../../../controllers/designer-dashboard.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Get designer dashboard data (protected route) 2025-08-06
router.get('/', auth, getDesignerDashboard);

module.exports = router; 