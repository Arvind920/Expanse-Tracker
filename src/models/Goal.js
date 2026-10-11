const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'Savings'
  },
  targetDate: {
    type: String
  },
  color: {
    type: String,
    default: '#10B981'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
