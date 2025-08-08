const express = require('express');
const {
  updateAcceptShare,
  getAlbumShareById,
  getAllShareRequests,
  getShareRequestsByAlbum
} = require('../../../controllers/album-share.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Update accept_share status (protected route) 2025-08-07
router.put('/update', auth, updateAcceptShare);

// Get album share by ID with auth (protected route) 2025-08-07
router.get('/:id', auth, getAlbumShareById);

// Get all share requests with auth (protected route) 2025-08-07
router.get('/', auth, getAllShareRequests);

// Get share requests by album with auth (protected route) 2025-08-07
router.get('/album/:album_id', auth, getShareRequestsByAlbum);

module.exports = router;
