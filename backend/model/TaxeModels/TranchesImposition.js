const mongoose = require('mongoose');

const TranchesImpositionSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    taxe: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxes', required: true },
    limite_inferieure: { type: Number, required: true },
    limite_superieure: { type: Number, required: true },
    taux: { type: Number, required: true },
    date_effet: { type: Date, required: true }
}, { collection: 'tranchesimposition' });

const TranchesImposition = mongoose.model('TranchesImposition', TranchesImpositionSchema);
module.exports = TranchesImposition;