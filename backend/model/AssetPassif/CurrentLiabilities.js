const mongoose = require('mongoose');
const Liability = require("./Liability"); 
const CurrentLiabilitiesSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ["trade_payables", "tax_liabilities", "social_security_liabilities", "other_liabilities"],
        required: true
    }
});

module.exports = Liability.discriminator('CurrentLiabilities', CurrentLiabilitiesSchema);
