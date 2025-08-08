const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const planMapUserSchema = new mongoose.Schema({
  planMap_id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  plan_id: {
    type: Number,
    ref: 'PlansPricing',
    required: [true, 'Plan ID is required']
  },
  planmap_month_year: {
    type: String,
    enum: ['30', '365', '90', '180'],
    required: [true, 'Plan map month year is required']
  },
  paymentstatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  payment_id: {
    type: Number,
    ref: 'Payment'
  },
  expired_plan: {
    type: Number,
    default: 0
  },
  status: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: Number,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: Number,
    ref: 'User'
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Use mongoose-sequence for auto-incrementing planMap_id
planMapUserSchema.plugin(AutoIncrement(mongoose), { inc_field: 'planMap_id' });

// Update the updated_at field before saving
planMapUserSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Method to calculate expired_plan based on payment date and plan duration
planMapUserSchema.methods.calculateExpiredPlan = function() {
  if (!this.payment_id || this.paymentstatus !== 'completed') {
    this.expired_plan = 0;
    return;
  }

  // This will be updated when payment is completed
  // The calculation will be done in the controller
};

const PlanMapUser = mongoose.model('PlanMapUser', planMapUserSchema);

module.exports = PlanMapUser; 