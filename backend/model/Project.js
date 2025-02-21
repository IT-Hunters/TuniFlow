const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    status: { type: String, required: true },
    due_date: { type: Date, required: true, unique: true },
    businessManager: { type: Schema.Types.ObjectId, ref: "BusinessManager", unique: true } ,
    accountants: [{ type: Schema.Types.ObjectId, ref: "Accountant" }] ,
    financialManagers: [{ type: Schema.Types.ObjectId, ref: "FinancialManager" }], 
    businessOwner: { type: Schema.Types.ObjectId, ref: "BusinessOwner", required: true },
    rhManagers: [{ type: Schema.Types.ObjectId, ref: "RH" }] ,
    obligations_fiscales: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ObligationsFiscales' }],
    taxes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxes' }],
    assets_actif: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AssetActif' }],
    assets_passif: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AssetPassif' }]

});

const Project = mongoose.model("Project", ProjectSchema);
module.exports = Project;
