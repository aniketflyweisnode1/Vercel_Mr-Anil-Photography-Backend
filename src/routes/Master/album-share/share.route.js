const express = require('express');
const { 
  shareAlbumsBylink,
  shareAlbumsByQR 
} = require('../../../controllers/albums.controller.js');
const { createAlbumShare } = require('../../../controllers/album-share.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');

const router = express.Router();

// Create a new album share (protected route) 2025-08-07
router.get('/:type/:shareLink', auth, createAlbumShare);

// Share albums by link (protected route) 2025-08-07
router.get('/share/Link/:album_id', auth, shareAlbumsBylink);

// Share albums by QR code (protected route) 2025-08-07
router.get('/shareQR/Link/:album_id', auth, shareAlbumsByQR);

module.exports = router;
