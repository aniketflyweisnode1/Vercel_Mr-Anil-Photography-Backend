const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const plansPricingSchema = new mongoose.Schema({
  plans_id: {
    type: Number,
    unique: true
  },
  type: {
    type: String,
    enum: ['New', 'Offer', 'Best', 'Saver'],
    required: [true, 'Type is required']
  },
  pricing_month: {
    type: Number,
    required: [true, 'Monthly pricing is required'],
    min: [0, 'Monthly pricing cannot be negative']
  },
  pricing_year: {
    type: Number,
    required: [true, 'Yearly pricing is required'],
    min: [0, 'Yearly pricing cannot be negative']
  },
  pricing_offer: {
    type: Number,
    min: [0, 'Offer pricing cannot be negative']
  },
  plan_name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [100, 'Plan name cannot be more than 100 characters']
  },
  credit: {
    type: Number,
    default: 0,
    min: [0, 'Credit cannot be negative']
  },
  qr_sharing: {
    type: Boolean,
    default: false
  },
  qr_sharing_text: {
    type: String,
    trim: true,
    maxlength: [500, 'QR sharing text cannot be more than 500 characters']
  },
  sharing_via_link: {
    type: Boolean,
    default: false
  },
  sharing_via_link_text: {
    type: String,
    trim: true,
    maxlength: [500, 'Sharing via link text cannot be more than 500 characters']
  },
  edit_song: {
    type: Boolean,
    default: false
  },
  edit_song_text: {
    type: String,
    trim: true,
    maxlength: [500, 'Edit song text cannot be more than 500 characters']
  },
  required_to_view: {
    type: Boolean,
    default: true
  },
  required_to_view_text: {
    type: String,
    trim: true,
    maxlength: [500, 'Required to view text cannot be more than 500 characters']
  },
  social_media: {
    type: Boolean,
    default: true
  },
  social_media_text: {
    type: String,
    trim: true,
    maxlength: [500, 'Social media text cannot be more than 500 characters']
  },
  arrange_sheets: {
    type: Boolean,
    default: true
  },
  arrange_sheets_text: {
    type: String,
    trim: true,
    maxlength: [500, 'Arrange sheets text cannot be more than 500 characters']
  },
  chat_clients: {
    type: Boolean,
    default: true
  },
  chat_clients_text: {
    type: String,
    trim: true,
    maxlength: [500, 'Chat clients text cannot be more than 500 characters']
  },
  views_monetization: {
    type: Boolean,
    default: true
  },
  views_monetization_text: {
    type: String,
    trim: true,
    maxlength: [500, 'Views monetization text cannot be more than 500 characters']
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

// Use mongoose-sequence for auto-incrementing plans_id
plansPricingSchema.plugin(AutoIncrement(mongoose), { inc_field: 'plans_id' });

// Update the updatedAt field before saving
plansPricingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const PlansPricing = mongoose.model('PlansPricing', plansPricingSchema);

module.exports = PlansPricing; 