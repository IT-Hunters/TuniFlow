const mongoose = require('mongoose');
const AssetActif = require("./AssetActif"); 
const StockSchema = new mongoose.Schema({
    categorie_stock: { type: String, required: true, enum: ['RawMaterials', 'FinishedProducts'] },
    quantite: { type: Number, required: true },
    unite_value: { type: Number, required: true }
});

module.exports = AssetActif.discriminator('Stock', StockSchema);
