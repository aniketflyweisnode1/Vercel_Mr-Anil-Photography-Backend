const express = require('express');
const {
  uploadSingleFile,
  uploadMultipleFiles,
  getUserFiles,
  getFileById,
  updateFileMetadata,
  deleteFile,
  hardDeleteFile,
  getFileStats
} = require('../../../controllers/file-upload.controller.js');
const { auth } = require('../../../middleware/auth.middleware.js');
const router = express.Router();

// Upload single file (protected route) 2025-08-08
router.post('/upload', auth, uploadSingleFile);

// Upload multiple files (protected route) 2025-08-08
router.post('/upload-multiple', auth, uploadMultipleFiles);

// Get all files for the authenticated user (protected route) 2025-08-08
router.get('/files', auth, getUserFiles);

// Get single file by ID (protected route) 2025-08-08
router.get('/files/:file_id', auth, getFileById);

// Update file metadata (protected route) 2025-08-08
router.put('/files/:file_id', auth, updateFileMetadata);

// Soft delete file (protected route) 2025-08-08
router.delete('/files/:file_id', auth, deleteFile);

// Hard delete file - permanently remove (protected route) 2025-08-08
router.delete('/files/:file_id/permanent', auth, hardDeleteFile);

// Get file statistics (protected route) 2025-08-08
router.get('/stats', auth, getFileStats);

module.exports = router;
