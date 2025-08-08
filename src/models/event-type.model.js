const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const eventTypeSchema = new mongoose.Schema({
  event_type_id: {
    type: Number,
    unique: true
  },
  event_type: {
    type: String,
    required: [true, 'Event type is required'],
    trim: true,
    maxlength: [100, 'Event type cannot be more than 100 characters'],
    unique: true
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

// Use mongoose-sequence for auto-incrementing event_type_id
eventTypeSchema.plugin(AutoIncrement(mongoose), { inc_field: 'event_type_id', });
// Generate event_type_id before saving
eventTypeSchema.pre('save', async function(next) {
  if (this.isNew && !this.event_type_id) {
    const lastEventType = await this.constructor.findOne().sort({ event_type_id: -1 });
    this.event_type_id = lastEventType ? lastEventType.event_type_id + 1 : 1;
  }
  next();
});

const EventType = mongoose.model('EventType', eventTypeSchema);

module.exports = EventType;
