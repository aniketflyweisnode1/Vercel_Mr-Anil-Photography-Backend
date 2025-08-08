const express = require('express');
const {
  createDesignerMapPhotographer,
  updateDesignerMapPhotographer,
  getDesignerMapPhotographerById,
  getDesignerMappingsByCreatedBy,
  getAllDesignerMappings
} = require('../../../controllers/designer-map-photographers.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new designer map photographer (protected route) 2025-08-06
router.post('/create', auth, createDesignerMapPhotographer);

// Update designer map photographer (protected route) 2025-08-06
router.put('/update', auth, updateDesignerMapPhotographer);

// Get designer mappings by authenticated user (protected route) 2025-08-06
router.get('/my-mappings', auth, getDesignerMappingsByCreatedBy);

// Get all designer mappings with pagination and filtering 2025-08-06
router.get('/', getAllDesignerMappings);

// Get designer map photographer by ID 2025-08-06
router.get('/:id', getDesignerMapPhotographerById);

module.exports = router; 