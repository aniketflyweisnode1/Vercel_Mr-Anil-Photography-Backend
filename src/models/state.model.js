const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const stateSchema = new mongoose.Schema({
  state_id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'State name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'State name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'State code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [10, 'State code cannot be more than 10 characters']
  },
  country: {
    type: Number,
    ref: 'Country',
    required: [true, 'Country is required']
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

// Use mongoose-sequence for auto-incrementing state_id
stateSchema.plugin(AutoIncrement(mongoose), { inc_field: 'state_id' });

// Update the updatedAt field before saving
stateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const State = mongoose.model('State', stateSchema);

module.exports = State; 