const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth.middleware');
const {
  createNotificationMapUser,
  updateNotificationMapUser,
  getNotificationMapUserById,
  getAllNotificationMapUsers
} = require('../../../controllers/notification.map.user.controller');

// Create notification map user (with auth)  2025-08-04
router.post('/', auth, createNotificationMapUser);

// Get all notification map users 2025-08-04
router.get('/', getAllNotificationMapUsers);

// Update notification map user (with auth) 2025-08-04
router.put('/', auth, updateNotificationMapUser);

// Get notification map user by ID 2025-08-04
router.get('/:map_id', getNotificationMapUserById);

module.exports = router; 