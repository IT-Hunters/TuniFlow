const PassifsNonCourantsSchema = new mongoose.Schema({
    emprunts: { type: Number, required: true },
    provisions: { type: Number, required: true },
    autres_passifs_noncourant: { type: Number, required: true }
});

module.exports = AssetPassif.discriminator('PassifsNonCourants', PassifsNonCourantsSchema);
