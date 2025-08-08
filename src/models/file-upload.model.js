const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const fileUploadSchema = new mongoose.Schema({
  file_id: {
    type: Number,
    unique: true
  },
  original_name: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true
  },
  file_name: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  file_url: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  file_size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mime_type: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true
  },
  file_type: {
    type: String,
    enum: ['image', 'video', 'document', 'audio', 'other'],
    default: 'other'
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  album_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Albums'
  },
  is_public: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['active', 'deleted', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add auto-increment for file_id
fileUploadSchema.plugin(AutoIncrement(mongoose), { inc_field: 'file_id' });

// Index for better query performance
fileUploadSchema.index({ uploaded_by: 1, created_at: -1 });
fileUploadSchema.index({ album_id: 1 });
fileUploadSchema.index({ file_type: 1 });
fileUploadSchema.index({ status: 1 });

module.exports = mongoose.model('FileUpload', fileUploadSchema);
