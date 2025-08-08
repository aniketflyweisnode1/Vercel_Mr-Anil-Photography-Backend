const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const countrySchema = new mongoose.Schema({
  country_id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Country name is required'],
    trim: true,
    maxlength: [100, 'Country name cannot be more than 100 characters']
  },
  nameCode: {
    type: String,
    required: [true, 'Country name code is required'],
    trim: true,
    maxlength: [3, 'Country name code cannot be more than 3 characters'],
    uppercase: true
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

// Use mongoose-sequence for auto-incrementing country_id
countrySchema.plugin(AutoIncrement(mongoose), { inc_field: 'country_id' });

// Update the updatedAt field before saving
countrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Country = mongoose.model('Country', countrySchema);

module.exports = Country; 