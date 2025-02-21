const ImmobilisationFinanciereSchema = new mongoose.Schema({
    type_incorporel: { type: String, required: true },
    date: { type: Date, required: true }
});

module.exports = AssetActif.discriminator('ImmobilisationFinancière', ImmobilisationFinanciereSchema);
