const mongoose = require('mongoose');
const AssetActif = require("./AssetActif"); 
const TangibleAssetSchema = new mongoose.Schema({
    type_corporel: { type: String, required: true, enum: ['Land', 'Building', 'Equipment', 'TransportEquipment'] }
});

module.exports = AssetActif.discriminator('Tangible Asset', TangibleAssetSchema);
