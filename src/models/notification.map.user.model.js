const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const notificationMapUserSchema = new mongoose.Schema({
  map_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  notification_id: {
    type: Number,
    ref: 'Notification',
    required: [true, 'Notification ID is required']
  },
  is_read: {
    type: Boolean,
    default: false
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

// Use mongoose-sequence for auto-incrementing map_id
notificationMapUserSchema.plugin(AutoIncrement(mongoose), { inc_field: 'map_id' });

// Update the updatedAt field before saving
notificationMapUserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const NotificationMapUser = mongoose.model('NotificationMapUser', notificationMapUserSchema);

module.exports = NotificationMapUser; 