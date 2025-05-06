const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['À faire', 'En cours', 'Complétée'], default: 'À faire' },
  dueDate: { type: Date, default: null }, // Nouveau champ pour la date d'échéance
  isArchived: { type: Boolean, default: false }, // Nouveau champ pour l'archivage
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);