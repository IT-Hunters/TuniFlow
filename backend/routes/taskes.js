const express = require('express');
const router = express.Router();
const Task = require('../model/Task');
const { authenticateJWT } = require('../config/autorisation');

// Récupérer les tâches de l'utilisateur connecté
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter une nouvelle tâche
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { description, status } = req.body;
    console.log('Données reçues:', req.body);
    const task = new Task({
      userId: req.user.userId,
      description,
      status,
    });
    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error('Erreur détaillée:', err);
    res.status(400).json({ message: err.message || 'Erreur lors de l\'ajout de la tâche' });
  }
});

// Mettre à jour une tâche (status ou description)
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.description) updates.description = req.body.description;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: 'Erreur lors de la mise à jour de la tâche' });
  }
});

// Supprimer une tâche
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    console.log('Tentative de suppression - ID:', req.params.id, 'UserId:', req.user.userId); // Débogage
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!task) {
      console.log('Tâche non trouvée avec ID:', req.params.id, 'pour userId:', req.user.userId); // Débogage
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    console.log('Tâche supprimée avec succès:', task);
    res.status(200).json({ message: 'Tâche supprimée avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression de la tâche' });
  }
});

module.exports = router;