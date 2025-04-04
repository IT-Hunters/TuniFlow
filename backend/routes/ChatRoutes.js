const express = require('express');
const router = express.Router();
const { startChat, sendMessage, getChatHistory, getUserChats,addMessage,createChat } = require('../controllers/chatController');
const { authenticateJWT } = require('../config/autorisation');

router.post("/start", authenticateJWT, startChat);
router.post("/message", authenticateJWT, sendMessage);
router.get("/:chatId", authenticateJWT, getChatHistory);
router.get("/user/chats", authenticateJWT, getUserChats); // Nouvelle route
// Dans chatRoutes.js
router.post("/:chatId/message", authenticateJWT, addMessage);
router.post("/create", authenticateJWT, createChat);

module.exports = router;