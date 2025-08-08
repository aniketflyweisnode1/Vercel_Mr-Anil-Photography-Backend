const FileUpload = require('../models/file-upload.model');
const Busboy = require('busboy');
const { 
  getFileType, 
  generateFileName, 
  uploadToS3, 
  deleteFromS3, 
  validateFileType, 
  validateFileSize 
} = require('../utils/s3.utils');

// Upload single file
exports.uploadSingleFile = async (req, res) => {
  try {
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be multipart/form-data'
      });
    }

    const busboy = Busboy({ headers: req.headers });
    let fileData = null;
    let fields = {};

    busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
      if (fieldname !== 'file') {
        file.resume();
        return;
      }

      const chunks = [];
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        fileData = {
          buffer: Buffer.concat(chunks),
          filename,
          encoding,
          mimeType
        };
      });
    });

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('finish', async () => {
      try {
        if (!fileData) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        // Validate file size (10MB limit)
        if (!validateFileSize(fileData.buffer.length)) {
          return res.status(400).json({
            success: false,
            message: 'File size too large. Maximum size is 10MB'
          });
        }

        // Validate file type
        if (!validateFileType(fileData.mimeType)) {
          return res.status(400).json({
            success: false,
            message: 'File type not allowed'
          });
        }

        const fileName = generateFileName(fileData.filename);
        const fileType = getFileType(fileData.mimeType);

        // Upload to S3
        const s3Result = await uploadToS3(fileData.buffer, fileName, fileData.mimeType, fileType);

        if (!s3Result.success) {
          return res.status(500).json({
            success: false,
            message: 'Error uploading to S3',
            error: s3Result.error
          });
        }

        // Save file info to database
        const fileUpload = new FileUpload({
          original_name: fileData.filename,
          file_name: fileName,
          file_url: s3Result.url,
          file_size: fileData.buffer.length,
          mime_type: fileData.mimeType,
          file_type: fileType,
          uploaded_by: req.user.id,
          album_id: fields.album_id || null,
          is_public: fields.is_public === 'true',
          tags: fields.tags ? fields.tags.split(',').map(tag => tag.trim()) : [],
          description: fields.description || ''
        });

        await fileUpload.save();

        res.status(201).json({
          success: true,
          message: 'File uploaded successfully',
          data: {
            file_id: fileUpload.file_id,
            original_name: fileUpload.original_name,
            file_name: fileUpload.file_name,
            file_url: fileUpload.file_url,
            file_size: fileUpload.file_size,
            mime_type: fileUpload.mime_type,
            file_type: fileUpload.file_type,
            uploaded_by: fileUpload.uploaded_by,
            album_id: fileUpload.album_id,
            is_public: fileUpload.is_public,
            tags: fileUpload.tags,
            description: fileUpload.description,
            created_at: fileUpload.createdAt
          }
        });

      } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({
          success: false,
          message: 'Error uploading file',
          error: error.message
        });
      }
    });

    req.pipe(busboy);

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

// Upload multiple files
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be multipart/form-data'
      });
    }

    const busboy = Busboy({ headers: req.headers });
    const files = [];
    let fields = {};

    busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
      if (!fieldname.startsWith('files')) {
        file.resume();
        return;
      }

      const chunks = [];
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        files.push({
          buffer: Buffer.concat(chunks),
          filename,
          encoding,
          mimeType
        });
      });
    });

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('finish', async () => {
      try {
        if (files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No files uploaded'
          });
        }

        const uploadedFiles = [];
        const failedFiles = [];

        for (const fileData of files) {
          try {
            // Validate file size
            if (!validateFileSize(fileData.buffer.length)) {
              failedFiles.push({
                filename: fileData.filename,
                reason: 'File size too large'
              });
              continue;
            }

            // Validate file type
            if (!validateFileType(fileData.mimeType)) {
              failedFiles.push({
                filename: fileData.filename,
                reason: 'File type not allowed'
              });
              continue;
            }

            const fileName = generateFileName(fileData.filename);
            const fileType = getFileType(fileData.mimeType);

            // Upload to S3
            const s3Result = await uploadToS3(fileData.buffer, fileName, fileData.mimeType, fileType);

            if (!s3Result.success) {
              failedFiles.push({
                filename: fileData.filename,
                reason: 'S3 upload failed'
              });
              continue;
            }

            // Save file info to database
            const fileUpload = new FileUpload({
              original_name: fileData.filename,
              file_name: fileName,
              file_url: s3Result.url,
              file_size: fileData.buffer.length,
              mime_type: fileData.mimeType,
              file_type: fileType,
              uploaded_by: req.user.id,
              album_id: fields.album_id || null,
              is_public: fields.is_public === 'true',
              tags: fields.tags ? fields.tags.split(',').map(tag => tag.trim()) : [],
              description: fields.description || ''
            });

            await fileUpload.save();
            uploadedFiles.push(fileUpload);

          } catch (error) {
            failedFiles.push({
              filename: fileData.filename,
              reason: error.message
            });
          }
        }

        res.status(201).json({
          success: true,
          message: `${uploadedFiles.length} files uploaded successfully`,
          data: {
            uploaded: uploadedFiles.map(file => ({
              file_id: file.file_id,
              original_name: file.original_name,
              file_name: file.file_name,
              file_url: file.file_url,
              file_size: file.file_size,
              mime_type: file.mime_type,
              file_type: file.file_type,
              uploaded_by: file.uploaded_by,
              album_id: file.album_id,
              is_public: file.is_public,
              tags: file.tags,
              description: file.description,
              created_at: file.createdAt
            })),
            failed: failedFiles
          }
        });

      } catch (error) {
        console.error('Multiple files upload error:', error);
        res.status(500).json({
          success: false,
          message: 'Error uploading files',
          error: error.message
        });
      }
    });

    req.pipe(busboy);

  } catch (error) {
    console.error('Multiple files upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message
    });
  }
};

// Get all files for a user
exports.getUserFiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, file_type, album_id, status = 'active' } = req.query;
    const skip = (page - 1) * limit;

    const filter = { uploaded_by: req.user.id, status };
    if (file_type) filter.file_type = file_type;
    if (album_id) filter.album_id = album_id;

    const files = await FileUpload.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('album_id', 'album_name');

    const total = await FileUpload.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: files,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching files',
      error: error.message
    });
  }
};

// Get single file by ID
exports.getFileById = async (req, res) => {
  try {
    const file = await FileUpload.findOne({
      file_id: req.params.file_id,
      uploaded_by: req.user.id,
      status: 'active'
    }).populate('album_id', 'album_name');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      data: file
    });

  } catch (error) {
    console.error('Get file by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file',
      error: error.message
    });
  }
};

// Delete file (soft delete)
exports.deleteFile = async (req, res) => {
  try {
    const file = await FileUpload.findOne({
      file_id: req.params.file_id,
      uploaded_by: req.user.id,
      status: 'active'
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Soft delete - update status to deleted
    file.status = 'deleted';
    await file.save();

    // Optionally delete from S3 (uncomment if you want hard delete)
    // const s3Result = await deleteFromS3(file.file_name, file.file_type);
    // if (!s3Result.success) {
    //   console.error('S3 delete error:', s3Result.error);
    // }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

// Hard delete file (permanently remove from S3 and database)
exports.hardDeleteFile = async (req, res) => {
  try {
    const file = await FileUpload.findOne({
      file_id: req.params.file_id,
      uploaded_by: req.user.id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete from S3
    const s3Result = await deleteFromS3(file.file_name, file.file_type);
    if (!s3Result.success) {
      console.error('S3 delete error:', s3Result.error);
    }

    // Delete from database
    await FileUpload.findByIdAndDelete(file._id);

    res.status(200).json({
      success: true,
      message: 'File permanently deleted'
    });

  } catch (error) {
    console.error('Hard delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

// Update file metadata
exports.updateFileMetadata = async (req, res) => {
  try {
    const { tags, description, is_public, album_id } = req.body;

    const file = await FileUpload.findOneAndUpdate(
      {
        file_id: req.params.file_id,
        uploaded_by: req.user.id,
        status: 'active'
      },
      {
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
        description,
        is_public,
        album_id
      },
      { new: true, runValidators: true }
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File metadata updated successfully',
      data: file
    });

  } catch (error) {
    console.error('Update file metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating file metadata',
      error: error.message
    });
  }
};

// Get file statistics
exports.getFileStats = async (req, res) => {
  try {
    const stats = await FileUpload.aggregate([
      { $match: { uploaded_by: req.user.id, status: 'active' } },
      {
        $group: {
          _id: '$file_type',
          count: { $sum: 1 },
          totalSize: { $sum: '$file_size' }
        }
      }
    ]);

    const totalFiles = await FileUpload.countDocuments({ 
      uploaded_by: req.user.id, 
      status: 'active' 
    });

    const totalSize = await FileUpload.aggregate([
      { $match: { uploaded_by: req.user.id, status: 'active' } },
      { $group: { _id: null, totalSize: { $sum: '$file_size' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_files: totalFiles,
        total_size: totalSize[0]?.totalSize || 0,
        by_type: stats
      }
    });

  } catch (error) {
    console.error('Get file stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file statistics',
      error: error.message
    });
  }
};
