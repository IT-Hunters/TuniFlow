const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WalletSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "TND" },
  type: { type: String, required: true },
  project: { type: Schema.Types.ObjectId, ref: "Project", unique: true } // Référence au projet
}, {
  collection: "wallets",
  timestamps: true
});

const Wallet = mongoose.model("Wallet", WalletSchema);
module.exports = Wallet;