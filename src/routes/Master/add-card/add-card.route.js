const express = require('express');
const {
  createCard,
  updateCard,
  getCardById,
  getAllCards,
  getCardsByAuth
} = require('../../../controllers/add-card.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new card (protected route) 2025-08-07
router.post('/create', auth, createCard);

// Update card (protected route) 2025-08-07
router.put('/update', auth, updateCard);

// Get card by ID (protected route) 2025-08-07
router.get('/:id', auth, getCardById);

// Get all cards (protected route - admin only) 2025-08-07
router.get('/', auth, getAllCards);



module.exports = router;
