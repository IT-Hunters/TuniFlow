const mongoose = require('mongoose');
const TaxesSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    nom_taxe: { type: String, required: true },
    taux: { type: Number, required: true },
    description: { type: String },
    date_effet: { type: Date, required: true },
    categorie: { type: String, required: true, enum: ['Impôt Direct', 'Impôt Indirect', 'Taxe Locale'] },
    projet: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
}, { collection: 'taxes' });

const Taxes = mongoose.model('Taxes', TaxesSchema);
module.exports = Taxes;
