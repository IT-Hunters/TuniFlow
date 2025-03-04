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
  },
  wallet_id: { type: Schema.Types.ObjectId, ref: "Wallet" },
}, { 
  discriminatorKey: "userType", // Clé pour la différenciation
  collection: "users",
  timestamps: true
});// Fonction pour obtenir tous les rôles disponibles sauf BUSINESS_OWNER et BUSINESS_MANAGER et admin
UserSchema.statics.getAllRoles = function() {
  const allRoles = this.schema.path("role").enumValues;
  const excludedRoles = ["BUSINESS_OWNER", "BUSINESS_MANAGER","ADMIN"];
  
  // Filtrer les rôles pour exclure BUSINESS_OWNER et BUSINESS_MANAGER
  const filteredRoles = allRoles.filter(role => !excludedRoles.includes(role));
  
  return filteredRoles;
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
