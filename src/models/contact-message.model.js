const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const contactMessageSchema = new mongoose.Schema({
  message_id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  contact_no: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit contact number']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  reply: {
    type: String,
    trim: true
  },
  reply_by: {
    type: Number,
    ref: 'User'
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

// Use mongoose-sequence for auto-incrementing message_id
contactMessageSchema.plugin(AutoIncrement(mongoose), { inc_field: 'message_id' });

// Update the updatedAt field before saving
contactMessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

module.exports = ContactMessage; 