const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["PENDING", "PAID", "CANCELLED"], 
    default: "PENDING" 
  },
  due_date: { type: Date, required: true },
  transaction_id: { type: Number }, // Optionnel
  created_at: { type: Date, default: Date.now },
  category: { type: String },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true } // Nouvelle relation
});

const Bill = mongoose.model("Bill", billSchema);
module.exports = Bill;