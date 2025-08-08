const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Helper function to get file type
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  return 'other';
};

// Helper function to generate unique filename
const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const uniqueId = uuidv4().substring(0, 8);
  return `${name}_${timestamp}_${uniqueId}${ext}`;
};

// Upload file to S3
const uploadToS3 = async (fileBuffer, fileName, mimeType, fileType) => {
  try {
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `uploads/${fileType}/${fileName}`,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read'
    };

    const result = await s3.upload(uploadParams).promise();
    return {
      success: true,
      url: result.Location,
      key: result.Key
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from S3
const deleteFromS3 = async (fileName, fileType) => {
  try {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `uploads/${fileType}/${fileName}`
    };

    await s3.deleteObject(deleteParams).promise();
    return {
      success: true
    };
  } catch (error) {
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get file URL from S3
const getFileUrl = (fileName, fileType) => {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/uploads/${fileType}/${fileName}`;
};

// Validate file type
const validateFileType = (mimeType) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
    'video/mp4', 'video/avi', 'video/mov', 'video/quicktime',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg', 'audio/wav', 'audio/mp3'
  ];
  return allowedTypes.includes(mimeType);
};

// Validate file size
const validateFileSize = (fileSize, maxSize = 10 * 1024 * 1024) => {
  return fileSize <= maxSize;
};

module.exports = {
  s3,
  getFileType,
  generateFileName,
  uploadToS3,
  deleteFromS3,
  getFileUrl,
  validateFileType,
  validateFileSize
};
