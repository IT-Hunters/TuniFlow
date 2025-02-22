const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Enumération pour le type de transaction
const TransactionTypeEnum = ["income", "expense"];

// Schéma Transaction (lié à Wallet)
const TransactionSchema = new Schema({
  wallet_id: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: TransactionTypeEnum, required: true }, // income = dépôt, expense = retrait
  balanceAfterTransaction: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { 
  collection: "transactions",
  timestamps: true
});

const Transaction = mongoose.model("Transaction", TransactionSchema);
module.exports = Transaction;
