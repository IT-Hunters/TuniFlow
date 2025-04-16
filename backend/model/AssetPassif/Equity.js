const mongoose = require('mongoose');
const Equity = require("./Liability"); 
const EquitySchema = new mongoose.Schema({
    category: {type: String,enum: ["share_capital", "reserves", "retained_earnings"],required: true}
});

module.exports = Equity.discriminator('Equity', EquitySchema);
