const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, 
  user_id: { type: Number, required: true },
  amount: { type: Number, required: true }, 
  status: { 
    type: String, 
    enum: ["PENDING", "PAID", "CANCELLED"],
    default: "PENDING" 
  },
  due_date: { type: Date, required: true },
  transaction_id: { type: Number },
  created_at: { type: Date, default: Date.now }, 
  category: { type: String } 
});

const Bill = mongoose.model("Bill", billSchema);

module.exports = Bill;
