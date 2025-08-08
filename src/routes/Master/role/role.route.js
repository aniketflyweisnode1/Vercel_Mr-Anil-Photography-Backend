const express = require('express');
const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole
} = require('../../../controllers/role.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');
const router = express.Router();

// Create a new role 2025-08-04
router.post('/create', createRole);

// Update role 2025-08-04
router.put('/update', auth, updateRole);

// Get all roles with pagination and filtering 2025-08-04
router.get('/', getAllRoles);

// Get role by MongoDB ID 2025-08-04
router.get('/:id', getRoleById);






module.exports = router; 