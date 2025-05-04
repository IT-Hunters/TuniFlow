const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticateJWT } = require('../config/autorisation');

// Créer une nouvelle salle de réunion
router.post('/', authenticateJWT, roomController.createRoom);

// Rejoindre une salle de réunion
router.post('/join/:roomId', authenticateJWT, roomController.joinRoom);

// Quitter une salle de réunion
router.post('/leave/:roomId', authenticateJWT, roomController.leaveRoom);
router.delete('/:roomId', authenticateJWT, roomController.deleteRoom);
// Obtenir les informations d'une salle
router.get('/:roomId', authenticateJWT, roomController.getRoomInfo);
router.get('/project/:projectId', authenticateJWT, roomController.getRoomsByProject);

module.exports = router; 