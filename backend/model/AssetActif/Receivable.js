const mongoose = require('mongoose');
const AssetActif = require("./AssetActif"); 
const ReceivableSchema  = new mongoose.Schema({
    receivable_type: { type: String, required: true, enum: ['Client', 'Supplier', 'Other'] }
});

module.exports = mongoose.model('Receivable', ReceivableSchema );
