const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  fullname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["ADMIN", "BUSINESS_OWNER", "ACCOUNTANT", "FINANCIAL_MANAGER", "BUSINESS_MANAGER", "RH"],
    required: true 
  }
}, { 
  discriminatorKey: "userType", // Clé pour la différenciation
  collection: "users",
  timestamps: true
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
