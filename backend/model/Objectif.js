const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const objectifSchema = new Schema({
    name: { type: String, required: true }, // Nom de l'objectif
    description: { type: String, required: true }, // Description de l'objectif
    target_amount: { type: Number, required: true }, // Montant cible
    minbudget: { type: Number, required: true }, // Budget minimum
    maxbudget: { type: Number, required: true }, // Budget maximum
    datedebut: { type: Date, required: true }, // Date de début
    datefin: { type: Date, required: true }, // Date de fin
    progress: { type: Number, default: 0 },  // Progrès de l'objectif (0-100)
    status: {
        type: String,
        required: true,
        enum: ["InProgress", "Completed", "Failed"], // Énumération pour le statut
        default: "Pending", // Valeur par défaut
    },  
    objectivetype: {
        type: String,
        required: true,
        enum: [
            "BUDGET",
            "COST_REDUCTION",
            "REVENUE_GROWTH",
            "PROFIT_MARGIN",
            "CASH_FLOW",
            "INVESTMENT",
            "DEBT_MANAGEMENT",
            "EXPENSE_CONTROL",
            "TAX_OPTIMIZATION",
        ], 
    },
    isStatic: { type: Boolean, required: true }, // Indique si l'objectif est statique
}, {
    timestamps: true, // Ajouter les champs createdAt et updatedAt
});

const Objectif = mongoose.model("Objectif", objectifSchema, "objectif");



module.exports =  Objectif;