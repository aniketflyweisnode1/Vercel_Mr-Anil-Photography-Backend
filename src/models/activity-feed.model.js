const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const activityFeedSchema = new mongoose.Schema({
  activity_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  emoji: {
    type: String,
    trim: true,
    maxlength: [10, 'Emoji cannot be more than 10 characters']
  },
  activity: {
    type: String,
    required: [true, 'Activity description is required'],
    trim: true,
    maxlength: [500, 'Activity description cannot be more than 500 characters']
  },
  status: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: Number,
    ref: 'User'
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Use mongoose-sequence for auto-incrementing activity_id
activityFeedSchema.plugin(AutoIncrement(mongoose), { inc_field: 'activity_id' });

// Update the updated_at field before saving
activityFeedSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const ActivityFeed = mongoose.model('ActivityFeed', activityFeedSchema);

module.exports = ActivityFeed; 