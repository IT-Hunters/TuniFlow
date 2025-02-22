const mongoose = require('mongoose');
const Liability = require("./Liability"); 
const NonCurrentLiabilitiesSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ["loans", "provisions", "other_noncurrent_liabilities"],
        required: true
    }
});

module.exports = Liability.discriminator('NonCurrentLiabilities', NonCurrentLiabilitiesSchema);
