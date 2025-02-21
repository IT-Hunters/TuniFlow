const StockSchema = new mongoose.Schema({
    categorie_stock: { type: String, required: true, enum: ['matiere premiers', 'produits finis'] },
    quantite: { type: Number, required: true }
});

module.exports = AssetActif.discriminator('Stock', StockSchema);
