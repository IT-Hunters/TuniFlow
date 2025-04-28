const mongoose = require("mongoose");

const financialStatementSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  wallet_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ["mensuel", "annuel"],
    required: true,
  },
  total_revenue: {
    type: Number,
    required: true,
    default: 0,
  },
  total_expenses: {
    type: Number,
    required: true,
    default: 0,
  },
  net_profit: {
    type: Number,
    required: true,
    default: 0,
  },
  taxes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tax",
  }],
});

module.exports = mongoose.model("FinancialStatement", financialStatementSchema);