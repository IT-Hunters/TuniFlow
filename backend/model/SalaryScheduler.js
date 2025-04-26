const mongoose = require('mongoose');
const Wallet = require('./wallet');

const salarySchedulerSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  payDay: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  lastProcessed: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SalaryScheduler', salarySchedulerSchema); 