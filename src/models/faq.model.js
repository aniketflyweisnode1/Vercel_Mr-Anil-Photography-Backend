const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const faqSchema = new mongoose.Schema({
  faq_id: {
    type: Number,
    unique: true
  },
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot be more than 500 characters']
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true
  },
  description: {
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

// Use mongoose-sequence for auto-incrementing faq_id
faqSchema.plugin(AutoIncrement(mongoose), { inc_field: 'faq_id' });

// Update the updatedAt field before saving
faqSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const FAQ = mongoose.model('FAQ', faqSchema);

module.exports = FAQ; 