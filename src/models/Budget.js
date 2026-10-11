const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true
  },
  limit: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
