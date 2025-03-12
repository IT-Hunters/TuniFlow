const mongoose = require("mongoose");
const User = require("./user");

const FinancialManager = User.discriminator("FinancialManager", new mongoose.Schema({
  department: { type: String },
  salary: { type: Number },
  hireDate: { type: Date },
  picture: { type: String },
  firstlogin: { type: Boolean, default: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", unique: true }, // Un seul projet par FinancialManage
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" }
}));

module.exports = FinancialManager;
