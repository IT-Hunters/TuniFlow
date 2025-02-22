const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const AssetActifSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    total_value: { type: Number, required: true },
    date_acquisition: { type: Date, required: true },
    type_actif: { type: String, required: true, enum: ['Intangible Asset', 'Tangible Asset', 'Receivables', 'Treasury', 'Financial Asset', 'Stock'] },
    projet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
}, { discriminatorKey: 'type_actif', collection: 'assetsactifs'});

AssetActifSchema.plugin(AutoIncrement, { inc_field: 'id' });
const AssetActif = mongoose.model('AssetActif', AssetActifSchema);
module.exports = AssetActif;    