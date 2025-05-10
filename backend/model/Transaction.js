const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  wallet_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["income", "expense"],
    required: true,
  },
  balanceAfterTransaction: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
  },
  is_taxable: {
    type: Boolean,
    default: false, // Indique si la transaction est soumise à la TVA
  },
  vat_rate: {
    type: Number,
    default: 0, // Taux de TVA (ex. : 0.19, 0.07, 0.13, 0.0)
  },
  is_flagged_fraud: {
    type: Boolean,
    default: false,
  },
  fraud_reason: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);