const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const LiabilitySchema = new mongoose.Schema({
    id_liability: { type: Number, unique: true }, 
    name: { type: String, required: true },
    total_value: { type: Number, required: true },
    date_commitment: { type: Date, required: true }, 
    type_liability: { type: String, required: true, enum: ['Equity', 'NonCurrentLiabilities', 'CurrentLiabilities'] },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
}, { discriminatorKey: 'type_liability', collection: 'liabilities' });

LiabilitySchema.plugin(AutoIncrement, { inc_field: 'id_liability' });
const Liability = mongoose.model('Liability', LiabilitySchema);
module.exports = Liability;
