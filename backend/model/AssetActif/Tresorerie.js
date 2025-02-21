const TresorerieSchema = new mongoose.Schema({
    type_tresorerie: { type: String, required: true, enum: ['Caisse', 'Banque', 'Placement_Court_Terme', 'Participation', 'Dépôt_Long_Terme', 'Obligation'] },
    solde: { type: String, required: true }
});

module.exports = mongoose.model('Tresorerie', TresorerieSchema);

