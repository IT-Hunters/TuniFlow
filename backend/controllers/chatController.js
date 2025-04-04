const Chat = require("../model/Chat");
const userModel = require("../model/user");
const BusinessOwner = require("../model/BusinessOwner");

const startChat = async (req, res) => {
    try {
        const { recipientId, projectId } = req.body;
        const senderId = req.user.userId;

        const sender = await BusinessOwner.findById(senderId);
        if (!sender || sender.role !== "BUSINESS_OWNER") {
            return res.status(403).json({ message: "Only Business Owners can start chats with Admin" });
        }

        const recipient = await userModel.findById(recipientId);
        if (!recipient || recipient.role !== "ADMIN") {
            return res.status(400).json({ message: "Recipient must be an Admin" });
        }

        let chat = await Chat.findOne({
            participants: { $all: [senderId, recipientId] }
        });

        if (!chat) {
            chat = new Chat({
                project: projectId || null,
                participants: [senderId, recipientId],
                messages: []
            });
            await chat.save();
        }

        res.status(200).json({ message: "Chat started", chat });
    } catch (error) {
        console.error("Error starting chat:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const sendMessage = async (req, res) => {
    console.log("sendMessage appelé avec:", req.body, "Utilisateur:", req.user);
    const { content, chatId } = req.body;
    const senderId = req.user.userId;
    const adminId = "67bee9c72a104f8241d58e7d";

    try {
        let chat;
        if (chatId) {
            chat = await Chat.findById(chatId);
            if (!chat) {
                return res.status(404).json({ message: "Chat non trouvé" });
            }
        } else {
            chat = await Chat.findOne({
                participants: { $all: [senderId, adminId] }
            });
            if (!chat) {
                chat = new Chat({
                    participants: [senderId, adminId],
                    messages: [],
                    createdBy: "System",
                    createdAt: new Date()
                });
                await chat.save();
                console.log("Chat créé dynamiquement:", {
                    chatId: chat._id,
                    participants: chat.participants
                });
                if (global.io) {
                    global.io.emit("newChat", {
                        chatId: chat._id,
                        participants: chat.participants
                    });
                }
            }
        }

        const newMessage = {
            sender: senderId,
            content,
            timestamp: new Date()
        };
        chat.messages.push(newMessage);
        await chat.save();

        if (global.io) {
            global.io.to(chat._id).emit("newMessage", {
                chatId: chat._id,
                ...newMessage
            });
        }

        res.status(200).json({ message: "Message envoyé", chatId: chat._id });
    } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;

        const chat = await Chat.findById(chatId)
            .populate("participants", "fullname email")
            .populate("messages.sender", "fullname");
        if (!chat) return res.status(404).json({ message: "Chat not found" });

        if (!chat.participants.some(p => p._id.toString() === userId)) {
            return res.status(403).json({ message: "You are not authorized to view this chat" });
        }

        res.status(200).json(chat);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Nouvelle route pour récupérer tous les chats d'un utilisateur
const getUserChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const chats = await Chat.find({ participants: userId })
            .populate("participants", "fullname email")
            .populate("messages.sender", "fullname");
        res.status(200).json(chats);
    } catch (error) {
        console.error("Error fetching user chats:", error);
        res.status(500).json({ message: "Server error" });
    }
};



// Dans chatController.js
const addMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, senderId } = req.body;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        const newMessage = {
            sender: senderId,
            content,
            timestamp: new Date(),
        };

        chat.messages.push(newMessage);
        await chat.save();

        // Émettre l'événement Socket.IO
        if (global.io) {
            global.io.to(chatId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Erreur lors de l'ajout du message:", error);
        res.status(500).json({ message: "Server error" });
    }
};
const createChat = async (req, res) => {
    try {
        const { participants } = req.body;
        if (!participants || participants.length !== 2) {
            return res.status(400).json({ message: "Invalid participants" });
        }

        // Vérifier si un chat existe déjà
        let chat = await Chat.findOne({
            participants: { $all: participants }
        });

        if (chat) {
            return res.status(200).json(chat);
        }

        // Créer un nouveau chat
        chat = new Chat({
            participants,
            messages: [],
            createdBy: req.user.userId,
            createdAt: new Date()
        });
        await chat.save();

        // Émettre l'événement Socket.IO
        if (global.io) {
            global.io.emit("newChat", {
                chatId: chat._id,
                participants: chat.participants
            });
        }

        res.status(201).json(chat);
    } catch (error) {
        console.error("Erreur lors de la création du chat:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { startChat, sendMessage, getChatHistory, getUserChats,addMessage,createChat };