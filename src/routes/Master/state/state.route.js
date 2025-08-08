const express = require('express');
const {
  createState,
  getAllStates,
  getStateById,
  getStateByCountry,
  updateState
} = require('../../../controllers/state.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new state 2025-08-04
router.post('/create', auth, createState);

// Get all states with pagination and filtering 2025-08-04
router.get('/', getAllStates);

// Get states by country 2025-08-04
router.get('/country/:country_id', getStateByCountry);

// Get state by MongoDB ID 2025-08-04
router.get('/:id', getStateById);

// Update state 2025-08-04
router.put('/', auth, updateState);


module.exports = router; 