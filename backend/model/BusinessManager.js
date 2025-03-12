const mongoose = require("mongoose");
const User = require("./user");

const BusinessManager = User.discriminator("BusinessManager", new mongoose.Schema({
  certification: { type: String },
  experienceYears: { type: Number },
  salary: { type: Number },
  specialization: { type: String, },
  picture: { type: String },
  firstlogin: { type: Boolean, default: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", unique: true },
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" }
}));

module.exports = BusinessManager;
