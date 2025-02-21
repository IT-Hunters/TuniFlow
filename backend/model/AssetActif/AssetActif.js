const mongoose = require('mongoose');

const AssetActifSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    nom: { type: String, required: true },
    total: { type: Number, required: true },
    date_acquisition: { type: Date, required: true },
    type_actif: { type: String, required: true, enum: ['Immobilisation Incorporelle', 'Immobilisation Corporelle', 'Créance', 'Trésorerie', 'Immobilisation Financière', 'Stock'] },
    projet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
}, { discriminatorKey: 'type_actif', collection: 'assetsactifs' });

const AssetActif = mongoose.model('AssetActif', AssetActifSchema);
module.exports = AssetActif;    