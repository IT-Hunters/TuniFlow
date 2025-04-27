const express = require('express');
const router = express.Router();
const projectConversationController = require('../controllers/projectConversationController');

// Créer une nouvelle conversation pour un projet
router.post('/', projectConversationController.createConversation);

// Obtenir les messages d'une conversation de projet
router.get('/:projectId', projectConversationController.getConversationMessages);

// Envoyer un message dans une conversation de projet
router.post('/:projectId/messages', projectConversationController.sendMessage);

module.exports = router; 