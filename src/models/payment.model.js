const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const paymentSchema = new mongoose.Schema({
  payment_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  planId: {
    type: Number,
    ref: 'PlansPricing',
    required: [true, 'Plan ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    required: [true, 'Payment method is required'],
    trim: true
  },
  paymentdate: {
    type: Date
  },
  reference_number: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: Number,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: Number,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Use mongoose-sequence for auto-incrementing payment_id
paymentSchema.plugin(AutoIncrement(mongoose), { inc_field: 'payment_id' });

// Update the updated_at field before saving
paymentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 