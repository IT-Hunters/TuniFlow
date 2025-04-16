const mongoose = require("mongoose");

const UserLogsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
  },
  login_time: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserLogs", UserLogsSchema);
