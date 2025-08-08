const express = require('express');
const {
  createAlbum,
  updateAlbum,
  getAlbumById,
  getAllAlbums,
  getAlbumsByAuthId,
  checkAlbum,
  adminSearchAlbums
} = require('../../../controllers/albums.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new album (protected route) 2025-08-06
router.post('/create', auth, createAlbum);
// Update album (protected route) 2025-08-06
router.put('/update', auth, updateAlbum);
// Get albums by authenticated user ID (protected route) 2025-08-06
router.get('/my-albums', auth, getAlbumsByAuthId);
// Get all albums with pagination and filtering 2025-08-06
router.get('/', getAllAlbums);
// Admin search albums by name and event date (protected route) 2025-08-07
router.get('/search', adminSearchAlbums);
// Get album by ID 2025-08-06
router.get('/:id', getAlbumById);
// Check album existence and basic info 2025-08-06
router.post('/check', checkAlbum);

module.exports = router; 