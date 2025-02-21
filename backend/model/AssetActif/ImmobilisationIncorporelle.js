const ImmobilisationIncorporelleSchema = new mongoose.Schema({
    type_incorporel: { type: String, required: true },
    duree_vie: { type: Number, required: true }
});

module.exports = AssetActif.discriminator('ImmobilisationIncorporelle', ImmobilisationIncorporelleSchema);
