const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const citySchema = new mongoose.Schema({
  city_id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
    maxlength: [100, 'City name cannot be more than 100 characters']
  },
  state_id: {
    type: Number,
    ref: 'State',
    required: [true, 'State is required']
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

// Use mongoose-sequence for auto-incrementing city_id
citySchema.plugin(AutoIncrement(mongoose), { inc_field: 'city_id' });

// Update the updatedAt field before saving
citySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const City = mongoose.model('City', citySchema);

module.exports = City; 