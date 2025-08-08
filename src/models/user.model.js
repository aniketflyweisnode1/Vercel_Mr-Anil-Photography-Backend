const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const userSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    unique: true
  },
  user_code: {
    type: String,
    unique: true,
    trim: true,
    maxlength: [10, 'User code cannot be more than 10 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  studio_name: {
    type: String,
    trim: true,
    maxlength: [100, 'Studio name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  foreDigitsPin: {
    type: String,
    trim: true,
    maxlength: [4, 'PIN must be 4 digits'],
    match: [/^[0-9]{4}$/, 'Please enter a valid 4-digit PIN']
  },
  country: {
    type: String,
    trim: true,
    maxlength: [50, 'Country name cannot be more than 50 characters']
  },
  state: {
    type: String,
    trim: true,
    maxlength: [50, 'State name cannot be more than 50 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City name cannot be more than 50 characters']
  },
  pinCode: {
    type: String,
    trim: true,
    match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit PIN code']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot be more than 500 characters']
  },
  printingNoOfAlbums: {
    type: Number,
    default: 0,
    min: [0, 'Number of albums cannot be negative']
  },
  printingLabDesigningLab: {
    type: Boolean,
    default: false
  },
  printingMachineModelNo: {
    type: String,
    trim: true,
    maxlength: [100, 'Machine model number cannot be more than 100 characters']
  },
  gstNo: {
    type: String,
    trim: true,
    maxlength: [15, 'GST number cannot be more than 15 characters'],
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  alternateNo: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  notifications_status: {
    type: Boolean,
    default: true
  },
  role_id: {
    type: Number,
    ref: 'Role',
    required: [true, 'Role is required']
  },
  user_img: {
    type: String,
    trim: true
  },
  login_permission: {
    type: Boolean,
    default: true
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

// Use mongoose-sequence for auto-incrementing user_id
userSchema.plugin(AutoIncrement(mongoose), { inc_field: 'user_id' });

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User; 