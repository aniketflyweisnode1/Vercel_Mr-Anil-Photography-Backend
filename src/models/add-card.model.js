const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence');

const addCardSchema = new mongoose.Schema({
  card_id: {
    type: Number,
    unique: true
  },
  holder_name: {
    type: String,
    required: [true, 'Card holder name is required'],
    trim: true,
    maxlength: [100, 'Card holder name cannot be more than 100 characters']
  },
  card_no: {
    type: String,
    required: [true, 'Card number is required'],
    trim: true,
    match: [/^[0-9]{16}$/, 'Please enter a valid 16-digit card number']
  },
  expire_date: {
    type: String,
    required: [true, 'Expiry date is required'],
    trim: true,
    match: [/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Please enter expiry date in MM/YY format']
  },
  cvc_no: {
    type: String,
    required: [true, 'CVC number is required'],
    trim: true,
    match: [/^[0-9]{3,4}$/, 'Please enter a valid 3 or 4 digit CVC number']
  },
  status: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Number,
    ref: 'User',
    required: [true, 'Created by user ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Number,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-increment for card_id
addCardSchema.plugin(AutoIncrement(mongoose), { inc_field: 'card_id' });

// Generate card_id before saving
addCardSchema.pre('save', async function(next) {
  if (this.isNew && !this.card_id) {
    const lastCard = await this.constructor.findOne().sort({ card_id: -1 });
    this.card_id = lastCard ? lastCard.card_id + 1 : 1;
  }
  next();
});

const AddCard = mongoose.model('AddCard', addCardSchema);

module.exports = AddCard;
