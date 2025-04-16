// model/Chat.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: "Project", required: false }, // Changé en non requis
  participants: [
    { type: Schema.Types.ObjectId, ref: "User", required: true }
  ],
  messages: [
    {
      sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Chat", ChatSchema);