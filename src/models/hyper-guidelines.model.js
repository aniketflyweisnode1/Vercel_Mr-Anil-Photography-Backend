const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const hyperGuidelinesSchema = new mongoose.Schema({
  hyper_id: {
    type: Number,
    unique: true
  },
  heading: {
    type: String,
    required: [true, 'Heading is required'],
    trim: true,
    maxlength: [200, 'Heading cannot be more than 200 characters']
  },
  sub_heading: {
    type: String,
    trim: true,
    maxlength: [300, 'Sub-heading cannot be more than 300 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
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

// Use mongoose-sequence for auto-incrementing hyper_id
hyperGuidelinesSchema.plugin(AutoIncrement(mongoose), { inc_field: 'hyper_id' });

// Update the updatedAt field before saving
hyperGuidelinesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const HyperGuidelines = mongoose.model('HyperGuidelines', hyperGuidelinesSchema);

module.exports = HyperGuidelines; 