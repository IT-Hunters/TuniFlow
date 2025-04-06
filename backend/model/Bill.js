const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["PENDING", "PAID", "CANCELLED"], 
    default: "PENDING" 
  },
  due_date: { type: Date, required: true },
  transaction_id: { type: Number },
  created_at: { type: Date, default: Date.now },
  category: { type: String },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  reminderSent: { type: Boolean, default: false },
  lastReminderDate: { type: Date },
  history: [
    {
      action: { type: String, required: true }, // Ex. "CREATED", "SENT", "PAID", "REMINDER_SENT"
      date: { type: Date, default: Date.now },
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    }
  ]
});

const Bill = mongoose.model("Bill", billSchema);
module.exports = Bill;