const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth.middleware');
const {
  createNotification,
  updateNotification,
  getNotificationById,
  getAllNotifications
} = require('../../../controllers/notifications.controller');

// Create notification (with auth) 2025-08-04
router.post('/', auth, createNotification);

// Get all notifications 2025-08-04
router.get('/', getAllNotifications);

// Update notification (with auth) 2025-08-04
router.put('/', auth, updateNotification);

// Get notification by ID 2025-08-04
router.get('/:notification_id', getNotificationById);

module.exports = router; 