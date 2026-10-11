const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'investment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'Cash'
  },
  note: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
