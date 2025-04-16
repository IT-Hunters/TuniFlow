const mongoose = require('mongoose');
const AssetActif = require("./AssetActif"); 
const IntangibleAssetSchema = new mongoose.Schema({
    type_IntangibleAsset: { type: String, required: true, enum: ['Patent', 'License', 'Goodwill']  },
});

module.exports = AssetActif.discriminator('Intangible Asset', IntangibleAssetSchema);
