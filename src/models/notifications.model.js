const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const notificationSchema = new mongoose.Schema({
  notification_id: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Notification title cannot be more than 200 characters']
  },
  notification_type: {
    type: String,
    required: [true, 'Notification type is required'],
    trim: true,
    maxlength: [50, 'Notification type cannot be more than 50 characters'],
    enum: ['info', 'warning', 'error', 'success', 'reminder', 'announcement']
  },
  description: {
    type: String,
    required: [true, 'Notification description is required'],
    trim: true,
    maxlength: [1000, 'Notification description cannot be more than 1000 characters']
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

// Use mongoose-sequence for auto-incrementing notification_id
notificationSchema.plugin(AutoIncrement(mongoose), { inc_field: 'notification_id' });

// Update the updatedAt field before saving
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 