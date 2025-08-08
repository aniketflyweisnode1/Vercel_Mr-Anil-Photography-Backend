const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth.middleware');
const {
  createSocialMedia,
  updateSocialMedia,
  getSocialMediaById,
  getAllSocialMedia
} = require('../../../controllers/social.media.controller');

// Create social media (with auth) 2025-08-04
router.post('/', auth, createSocialMedia);

// Get all social media 2025-08-04
router.get('/', getAllSocialMedia);

// Update social media (with auth) 2025-08-04
router.put('/', auth, updateSocialMedia);

// Get social media by ID 2025-08-04
router.get('/:social_id', getSocialMediaById);

module.exports = router; 