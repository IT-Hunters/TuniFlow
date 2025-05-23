const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  fullname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isFirstUpdate: { type: Boolean, default: true },
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
});
UserSchema.statics.getAllRoles = function () {
  const allRoles = this.schema.path('role').enumValues; // Récupère toutes les valeurs de l'énumération
  const specificRoles = allRoles.filter(role => 
    role === "RH" || role === "ACCOUNTANT" || role === "FINANCIAL_MANAGER"
  );
  return specificRoles; // Retourne uniquement les rôles spécifiques
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
