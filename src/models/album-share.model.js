const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const albumShareSchema = new mongoose.Schema({
  albumShare_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  album_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Albums',
    required: [true, 'Album ID is required']
  },
  shared_by: {
    type: String,
    enum: ['Shaplink', 'QRCode'],
    default: 'Shaplink'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  accept_share: {
    type: String,
    enum: ['Accepted', 'Rejected', 'Pending'],
    default: 'Pending'
  },
  status: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Number,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updatedBy: {
    type: Number,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Use mongoose-sequence for auto-incrementing albumShare_id
albumShareSchema.plugin(AutoIncrement(mongoose), { inc_field: 'albumShare_id' });

// Update the updatedAt field before saving
albumShareSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const AlbumShare = mongoose.model('AlbumShare', albumShareSchema);

module.exports = AlbumShare; 