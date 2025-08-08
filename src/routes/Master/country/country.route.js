const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth.middleware');
const {
  createCountry,
  updateCountry,
  getCountryById,
  getAllCountries
} = require('../../../controllers/country.controller');

// Create country (with auth) 2025-08-04
router.post('/', auth, createCountry);

// Get all countries 2025-08-04
router.get('/', getAllCountries);

// Update country (with auth) 2025-08-04
router.put('/', auth, updateCountry);

// Get country by ID 2025-08-04
router.get('/:country_id', getCountryById);

module.exports = router; 