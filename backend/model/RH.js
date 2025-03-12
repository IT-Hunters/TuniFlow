const mongoose = require("mongoose");
const User = require("./user");

const RH = User.discriminator("RH", new mongoose.Schema({
  certification: { type: String },
  experienceYears: { type: Number },
  salary: { type: Number },
  specialization: { type: String },
  picture: { type: String },
  firstlogin: { type: Boolean, default: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", unique: true } // Un seul projet par RH
}));

module.exports = RH;
