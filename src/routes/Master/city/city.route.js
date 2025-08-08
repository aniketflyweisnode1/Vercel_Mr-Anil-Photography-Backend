const express = require('express');
const {
  createCity,
  getAllCities,
  getCityById,
  getCitiesByStateId,
  updateCity
} = require('../../../controllers/city.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');
const router = express.Router();

// Create a new city 2025-08-04
router.post('/create', auth, createCity);

// Get all cities with pagination and filtering 2025-08-04
router.get('/', getAllCities);

// Get city by MongoDB ID 2025-08-04
router.get('/:id', getCityById);

// Get cities by state_id 2025-08-04
router.get('/:state_id', getCitiesByStateId);

// Update city 2025-08-04 
router.put('/update', auth, updateCity);


module.exports = router; 