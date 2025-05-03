const mongoose = require('mongoose');

const joinAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    required: true
  },
  reason: {
    type: String
  }
});

module.exports = mongoose.model('JoinAttempt', joinAttemptSchema);