const mongoose = require('mongoose');
const AssetPassifSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    nom: { type: String, required: true },
    total: { type: Number, required: true },
    date_engagement: { type: Date, required: true },
    type_passif: { type: String, required: true, enum: ['Capitaux Propres', 'Passifs Non Courants', 'Passifs Courants'] },
    projet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
}, { discriminatorKey: 'type_passif', collection: 'assetspassifs' });

const AssetPassif = mongoose.model('AssetPassif', AssetPassifSchema);
module.exports = AssetPassif;
