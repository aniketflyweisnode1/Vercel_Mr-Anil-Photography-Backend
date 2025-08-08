const express = require('express');
const {
  createPlanMapUser,
  updatePlanMapUser,
  getPlanMapUserById,
  getPlanMapUsersByCreatedBy,
  getAllPlanMapUsers
} = require('../../../controllers/plan-map-user.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new plan map user (protected route) 2025-08-06
router.post('/create', auth, createPlanMapUser);

// Update plan map user (protected route) 2025-08-06
router.put('/update', auth, updatePlanMapUser);

// Get plan map users by authenticated user (protected route) 2025-08-06
router.get('/my-plan-maps', auth, getPlanMapUsersByCreatedBy);

// Get all plan map users with pagination and filtering 2025-08-06
router.get('/', getAllPlanMapUsers);

// Get plan map user by ID 2025-08-06
router.get('/:id', getPlanMapUserById);

module.exports = router; 