const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const albumsSchema = new mongoose.Schema({
  albums_id: {
    type: Number,
    unique: true
  },
  photographer_id: {
    type: Number,
    ref: 'User',
    required: [true, 'Photographer ID is required']
  },
  album_title: {
    type: String,
    required: [true, 'Album title is required'],
    trim: true,
    maxlength: [200, 'Album title cannot be more than 200 characters']
  },
  event_type_id: {
    type: Number,
    ref: 'EventType',
    required: [true, 'Event type ID is required']
  },
  event_date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  client_name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Client name cannot be more than 100 characters']
  },
  client_contactNo: {
    type: String,
    required: [true, 'Client contact number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit contact number']
  },
  album_no: {
    type: String,
    unique: true,
    required: [true, 'Album number is required']
  },
  album_orientation: {
    type: String,
    enum: ['Portrait', 'Landscape'],
    default: 'Portrait'
  },
  fileType: {
    type: String,
    enum: ['Standard Flip', 'Book View', 'Single Scroll'],
    default: 'Standard Flip'
  },
  numberOfPages: {
    type: Number,
    required: [true, 'Number of pages is required'],
    min: [1, 'Number of pages must be at least 1']
  },
  upload_images: [{
    type: String,
    trim: true
  }],
  upload_songs: [{
    type: String,
    trim: true
  }],
  reorder_images: [{
    type: String,
    trim: true
  }],
  coverPhoto: {
    type: String,
    trim: true
  },
  generateQRCode: {
    type: Boolean,
    default: false
  },
  shaplink: {
    type: String,
    default: null
  },
  setExpiryDate: {
    type: Date
  },
  enableDownloads: {
    type: Boolean,
    default: false
  },
  passwordProtect: {
    type: String,
    trim: true
  },
  addWaterMark: {
    type: String,
    trim: true
  },
  addLogo: {
    type: String,
    trim: true
  },
  status: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Number,
    ref: 'User',
    required: [true, 'Created by user ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Number,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-increment for albums_id
albumsSchema.plugin(AutoIncrement(mongoose), { inc_field: 'albums_id' });

// Generate albums_id before saving
albumsSchema.pre('save', async function(next) {
  if (this.isNew && !this.albums_id) {
    const lastAlbum = await this.constructor.findOne().sort({ albums_id: -1 });
    this.albums_id = lastAlbum ? lastAlbum.albums_id + 1 : 1;
  }
  next();
});

const Albums = mongoose.model('Albums', albumsSchema);

module.exports = Albums; 