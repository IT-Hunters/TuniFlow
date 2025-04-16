const mongoose = require('mongoose');
const ObligationsFiscalesSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    nom_obligation: { type: String, required: true },
    description: { type: String, required: true },
    frequence: { type: String, required: true, enum: ['Mensuelle', 'Trimestrielle', 'Annuelle'] },
    date_limite: { type: Date, required: true },
    penalite_retard: { type: Number, required: true },
    projet: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
}, { collection: 'obligationsfiscales' });

const ObligationsFiscales = mongoose.model('ObligationsFiscales', ObligationsFiscalesSchema);
module.exports = ObligationsFiscales;
