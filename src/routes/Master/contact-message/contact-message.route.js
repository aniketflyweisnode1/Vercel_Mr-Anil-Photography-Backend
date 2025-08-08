const express = require('express');
const {
  createContactMessage,
  getAllContactMessage,
  getContactMessageById,
  updateContactMessage,
  createContactMessageWithoutAuth
} = require('../../../controllers/contact-message.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new contact-message entry (protected route) 2025-08-05
router.post('/create', auth, createContactMessage);

router.post('/createwithoutauth', createContactMessageWithoutAuth);

// Update contact-message entry (protected route) 2025-08-05
router.put('/update', auth, updateContactMessage);

// Get all contact-message entries (protected route) 2025-08-05
router.get('/', auth, getAllContactMessage);

// Get contact-message by ID (protected route) 2025-08-05
router.get('/:id', auth, getContactMessageById);

module.exports = router; 