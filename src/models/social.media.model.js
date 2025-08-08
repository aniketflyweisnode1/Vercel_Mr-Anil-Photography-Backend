const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const socialMediaSchema = new mongoose.Schema({
  social_id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Social media name is required'],
    trim: true,
    maxlength: [100, 'Social media name cannot be more than 100 characters']
  },
  url: {
    type: String,
    required: [true, 'Social media URL is required'],
    trim: true,
    maxlength: [500, 'Social media URL cannot be more than 500 characters'],
    match: [/^https?:\/\/.+/, 'Please enter a valid URL starting with http:// or https://']
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'User ID is required']
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

// Use mongoose-sequence for auto-incrementing social_id
socialMediaSchema.plugin(AutoIncrement(mongoose), { inc_field: 'social_id' });

// Update the updatedAt field before saving
socialMediaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SocialMedia = mongoose.model('SocialMedia', socialMediaSchema);

module.exports = SocialMedia; 