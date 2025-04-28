const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema({
  financial_statement_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FinancialStatement",
    required: true,
  },
  type: {
    type: String,
    enum: ["TVA", "Corporate Tax"],
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Tax", taxSchema);