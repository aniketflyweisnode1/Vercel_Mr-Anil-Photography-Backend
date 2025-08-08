const express = require('express');
const {
  createEventType,
  updateEventType,
  getEventTypeById,
  getAllEventTypes
} = require('../../../controllers/event-type.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new event type (protected route) 2025-08-07
router.post('/create', auth, createEventType);

// Update event type (protected route) 2025-08-07
router.put('/update', auth, updateEventType);

// Get event type by ID (protected route) 2025-08-07
router.get('/:event_type_id', auth, getEventTypeById);

// Get all event types (protected route) 2025-08-07
router.get('/', auth, getAllEventTypes);

module.exports = router;
