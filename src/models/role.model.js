const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const roleSchema = new mongoose.Schema({
  role_id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Role name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Role name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  permissions: [{
    type: String,
    trim: true
  }],
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

// Use mongoose-sequence for auto-incrementing role_id
roleSchema.plugin(AutoIncrement(mongoose), { inc_field: 'role_id' });

// Update the updatedAt field before saving
roleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role; 