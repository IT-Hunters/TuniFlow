const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WalletSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 }, // Balance toujours à 0 au début
  currency: { type: String, default: "TND" },
  type: { type: String, required: true }
}, { 
  collection: "wallets",
  timestamps: true
});

const Wallet = mongoose.model("Wallet", WalletSchema);
module.exports = Wallet;
