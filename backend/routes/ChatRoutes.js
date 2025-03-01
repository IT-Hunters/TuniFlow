var express = require('express');
var router = express.Router();
const { startChat, sendMessage, getChatHistory } = require('../controllers/auth');
const { authenticateJWT } = require('../config/autorisation');

// Routes pour le chat
router.post("/start", authenticateJWT, startChat);
router.post("/message", authenticateJWT, sendMessage);
router.get("/:chatId", authenticateJWT, getChatHistory);

module.exports = router;