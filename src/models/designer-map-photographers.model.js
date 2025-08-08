const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const designerMapPhotographersSchema = new mongoose.Schema({
  photographerMap_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
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

// Use mongoose-sequence for auto-incrementing photographerMap_id
designerMapPhotographersSchema.plugin(AutoIncrement(mongoose), { inc_field: 'photographerMap_id' });

// Update the updatedAt field before saving
designerMapPhotographersSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const DesignerMapPhotographers = mongoose.model('DesignerMapPhotographers', designerMapPhotographersSchema);

module.exports = DesignerMapPhotographers; 