const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    due_date: { type: Date, required: true, unique: true },
    businessManager: { type: Schema.Types.ObjectId, ref: "BusinessManager", unique: true } ,// Référence à BusinessManager
    accountants: [{ type: Schema.Types.ObjectId, ref: "Accountant" }] ,// Un projet a plusieurs accountants
    financialManagers: [{ type: Schema.Types.ObjectId, ref: "FinancialManager" }], // Plusieurs FinancialManagers
    businessOwner: { type: Schema.Types.ObjectId, ref: "BusinessOwner", required: true }, // Référence à BusinessOwner
    rhManagers: [{ type: Schema.Types.ObjectId, ref: "RH" }] // Plusieurs RH

});

const Project = mongoose.model("Project", ProjectSchema);
module.exports = Project;
