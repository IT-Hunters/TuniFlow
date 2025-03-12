const mongoose = require("mongoose");
const User = require("./user");

const Accountant = User.discriminator("Accountant", new mongoose.Schema({
  certification: { type: String },
  experienceYears: { type: Number},
  salary: { type: Number},
  specialization: { type: String },
  picture: { type: String },
  firstlogin: { type: Boolean, default: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", unique: true }, // Un seul projet par accountant
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" }
}));

module.exports = Accountant;
