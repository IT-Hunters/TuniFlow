const mongoose = require('mongoose');
const AssetActif = require("./AssetActif"); 
const FinancialAssetSchema = new mongoose.Schema({
    type_financement: { type: String, required: true,enum: ['Participation', 'LongTermDeposit','Bond'] },
});

module.exports = AssetActif.discriminator('Financial Asset', FinancialAssetSchema);
