const CapitauxPropresSchema = new mongoose.Schema({
    capital_social: { type: Number, required: true },
    reserves: { type: Number, required: true },
    resultats_non_distribue: { type: Number, required: true }
});

module.exports = AssetPassif.discriminator('CapitauxPropres', CapitauxPropresSchema);
