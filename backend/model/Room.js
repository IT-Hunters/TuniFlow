const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Room', roomSchema);