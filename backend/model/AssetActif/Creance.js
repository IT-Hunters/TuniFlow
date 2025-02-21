const CreanceSchema = new mongoose.Schema({
    type_creance: { type: String, required: true, enum: ['Client', 'Fournisseur', 'Autre'] },
    date_echeance: { type: Date, required: true }
});

module.exports = mongoose.model('Creance', CreanceSchema);
