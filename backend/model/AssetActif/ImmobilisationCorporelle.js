const ImmobilisationCorporelleSchema = new mongoose.Schema({
    type_corporel: { type: String, required: true, enum: ['Terrain', 'Bâtiment', 'Équipement', 'Matériel_Transport'] }
});

module.exports = AssetActif.discriminator('ImmobilisationCorporelle', ImmobilisationCorporelleSchema);
