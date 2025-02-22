const mongoose = require('mongoose');
const AssetActif = require("./AssetActif"); 
const TreasurySchema = new mongoose.Schema({
    type_Treasury: { type: String, required: true, enum: ['Cash', 'Bank', 'ShortTermInvestment', 'Participation', 'LongTermDeposit', 'Bond'] }
});

module.exports = mongoose.model('Treasury', TreasurySchema);

