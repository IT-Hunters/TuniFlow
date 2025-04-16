// models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: { type: String, required: true }, 
  action: { type: String, required: true }, 
  url: { type: String, required: true }, 
  method: { type: String, required: true }, 
  projectId: { type: String, required: true },
  statusCode: { type: Number }, 
  responseTime: { type: Number }, 
  ipAddress: { type: String }, 
  userAgent: { type: String }, 
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Log', logSchema);