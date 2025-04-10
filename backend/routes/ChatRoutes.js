const express = require('express');
const router = express.Router();
const { startChat, sendMessage, getChatHistory, getUserChats, addMessage, createChat, uploadFile } = require('../controllers/chatController');
const { authenticateJWT } = require('../config/autorisation');
const multerImage = require('../config/multer-picture-pdf'); // Importer multer-picture-pdf

router.post("/start", authenticateJWT, startChat);
router.post("/message", authenticateJWT, sendMessage);
router.get("/:chatId", authenticateJWT, getChatHistory);
router.get("/user/chats", authenticateJWT, getUserChats);
router.post("/:chatId/message", authenticateJWT, addMessage);
router.post("/create", authenticateJWT, createChat);
router.post("/upload", authenticateJWT, multerImage.single("file"), uploadFile); // Nouvelle route avec multer

module.exports = router;