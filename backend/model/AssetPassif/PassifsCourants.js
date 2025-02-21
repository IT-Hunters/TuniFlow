const PassifsCourantsSchema = new mongoose.Schema({
    dettes_fournisseurs: { type: Number, required: true },
    dettes_fiscales: { type: Number, required: true },
    dettes_sociales: { type: Number, required: true },
    autres_dettes: { type: Number, required: true }
});

module.exports = AssetPassif.discriminator('PassifsCourants', PassifsCourantsSchema);
