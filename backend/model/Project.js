const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  status: { type: String, required: true },
  amount: { type: Number },
  due_date: { type: Date, required: true, unique: false },
  businessManager: { type: Schema.Types.ObjectId, ref: "BusinessManager", unique: true },
  accountants: [{ type: Schema.Types.ObjectId, ref: "Accountant" }],
  financialManagers: [{ type: Schema.Types.ObjectId, ref: "FinancialManager" }],
  businessOwner: { type: Schema.Types.ObjectId, ref: "BusinessOwner", required: true },
  rhManagers: [{ type: Schema.Types.ObjectId, ref: "RH" }],
  obligations_fiscales: [{ type: Schema.Types.ObjectId, ref: "ObligationsFiscales" }],
  taxes: [{ type: Schema.Types.ObjectId, ref: "Taxes" }],
  assets_actif: [{ type: Schema.Types.ObjectId, ref: "AssetActif" }],
  assets_passif: [{ type: Schema.Types.ObjectId, ref: "AssetPassif" }],
  employees: [{ type: Schema.Types.ObjectId, ref: "Employe" }],
  wallet: { type: Schema.Types.ObjectId, ref: "Wallet", unique: true }, // Référence au wallet
  objectifs: [{ type: Schema.Types.ObjectId, ref: "Objectif" }],
}, {
  collection: "projects",
  timestamps: true
});

const Project = mongoose.model("Project", ProjectSchema);
module.exports = Project;