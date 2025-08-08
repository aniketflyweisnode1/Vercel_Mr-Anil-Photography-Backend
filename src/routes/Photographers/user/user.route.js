const express = require('express');
const {
  createUser,
  loginUser,
  logoutUser,
  getAllUsers,
  getUserById,
  getUserByUserId,
  updateUser,
  getProfile
} = require('../../../controllers/user.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new user 2025-08-04
router.post('/create',  createUser);

// Update user (protected route) 2025-08-04
router.put('/update', auth, updateUser);

// Login user 2025-08-04
router.post('/login', loginUser);

// Logout user (protected route) 2025-08-07
router.get('/logout', auth, logoutUser);

// Get current user profile (protected route) 2025-08-04
router.get('/profile', auth, getProfile);

// Get all users with pagination and filtering (protected route) 2025-08-04
router.get('/', auth, getAllUsers);

// Get user by user_id (numeric ID) (protected route) 2025-08-04
router.get('/user_id/:user_id', getUserByUserId);

// Get user by MongoDB ID (protected route) 2025-08-04
router.get('/:id', getUserById);

module.exports = router; 