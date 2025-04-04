import io from "socket.io-client";
import axios from "axios";

class ChatService {
    constructor() {
        this.socket = null;
        this.baseUrl = "http://localhost:5000";
        this.listeners = {
            newMessage: [],
            newChat: [],
            newNotification: [],
            userTyping: [],
            userStoppedTyping: [],
        };
    }

    getToken() {
        return localStorage.getItem("token");
    }

    initializeSocket() {
        if (this.socket) {
            console.log("Socket déjà initialisé:", this.socket.id);
            return this.socket;
        }

        const token = this.getToken();
        if (!token) {
            throw new Error("Token manquant. Veuillez vous connecter.");
        }

        this.socket = io(this.baseUrl, {
            auth: { token },
            transports: ["websocket"],
        });

        this.socket.on("connect", () => {
            console.log("Connecté à Socket.IO via ChatService:", this.socket.id);
        });

        this.socket.on("connect_error", (err) => {
            console.error("Erreur de connexion Socket.IO:", err.message);
        });

        this.socket.on("newMessage", (message) => {
            console.log("ChatService - newMessage reçu:", message);
            this.listeners.newMessage.forEach(callback => callback(message));
        });

        this.socket.on("newChat", (data) => {
            console.log("ChatService - newChat reçu:", data);
            this.listeners.newChat.forEach(callback => callback(data));
        });

        this.socket.on("newNotification", (notification) => {
            console.log("ChatService - newNotification reçu:", notification);
            this.listeners.newNotification.forEach(callback => callback(notification));
        });

        this.socket.on("userTyping", (data) => {
            console.log("ChatService - userTyping reçu:", data);
            this.listeners.userTyping.forEach(callback => callback(data));
        });

        this.socket.on("userStoppedTyping", (data) => {
            console.log("ChatService - userStoppedTyping reçu:", data);
            this.listeners.userStoppedTyping.forEach(callback => callback(data));
        });

        return this.socket;
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
            console.log(`Listener ajouté pour ${event}`);
        } else {
            console.error(`Événement non supporté: ${event}`);
        }
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
            console.log(`Listener retiré pour ${event}`);
        }
    }

    emitUserOnline(userId) {
        if (this.socket) {
            this.socket.emit("userOnline", userId);
            console.log(`userOnline émis pour userId: ${userId}`);
        }
    }

    joinChat(chatId) {
        if (this.socket && chatId) {
            this.socket.emit("joinChat", chatId);
            console.log(`joinChat émis pour chatId: ${chatId}`);
        }
    }

    sendMessage(chatId, content, senderId) {
        if (!chatId) {
            this.createChatWithAdmin(senderId).then(newChatId => {
                this.joinChat(newChatId);
                this.sendMessage(newChatId, content, senderId);
            }).catch(error => {
                console.error("Échec de la création du chat:", error);
            });
        } else {
            if (this.socket) {
                const messageData = { chatId, content, senderId };
                this.socket.emit("sendMessage", messageData);
                console.log("sendMessage émis:", messageData);
                // Ne pas ajouter localement ici, attendre "newMessage" du serveur
            }
            // La sauvegarde est gérée côté serveur, pas besoin de saveMessageToDB ici
        }
    }

    async createChatWithAdmin(userId) {
        const token = this.getToken();
        if (!token) {
            throw new Error("Token manquant pour créer le chat.");
        }
        try {
            const response = await axios.post(
                `${this.baseUrl}/chat/create`,
                { participants: [userId, "67bee9c72a104f8241d58e7d"] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const newChat = response.data;
            console.log("Nouveau chat créé:", newChat);
            return newChat._id;
        } catch (error) {
            console.error("Erreur lors de la création du chat:", error);
            throw error;
        }
    }

    async saveMessageToDB(chatId, content, senderId) {
        const token = this.getToken();
        if (!token) {
            throw new Error("Token manquant pour sauvegarder le message.");
        }
        try {
            await axios.post(
                `${this.baseUrl}/chat/${chatId}/message`,
                { content, senderId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Message sauvegardé dans la base de données.");
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du message:", error);
        }
    }

    emitTyping(chatId, senderId, isTyping) {
        if (this.socket && chatId && senderId) {
            if (isTyping) {
                this.socket.emit("typing", { chatId, senderId });
                console.log("typing émis:", { chatId, senderId });
            } else {
                this.socket.emit("stopTyping", { chatId, senderId });
                console.log("stopTyping émis:", { chatId, senderId });
            }
        }
    }

    async getChatHistory(chatId) {
        const token = this.getToken();
        if (!token) {
            throw new Error("Token manquant pour récupérer l'historique du chat.");
        }
        try {
            const response = await axios.get(`${this.baseUrl}/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const messages = response.data.messages || [];
            console.log("Historique des messages récupéré:", messages);
            // Normaliser les données pour s'assurer que sender est une chaîne
            return messages.map(msg => ({
                ...msg,
                sender: typeof msg.sender === "object" && msg.sender._id ? msg.sender._id : msg.sender,
            }));
        } catch (error) {
            console.error("Erreur lors de la récupération de l'historique:", error);
            throw error;
        }
    }

    async getUserChats() {
        const token = this.getToken();
        if (!token) {
            throw new Error("Token manquant pour récupérer les chats de l'utilisateur.");
        }
        try {
            const response = await axios.get(`${this.baseUrl}/chat/user/chats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Chats récupérés depuis l'API:", response.data);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération des chats:", error.response?.data || error.message);
            throw error;
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            Object.keys(this.listeners).forEach(event => {
                this.listeners[event] = [];
            });
            console.log("Socket.IO déconnecté via ChatService");
        }
    }
}

export default new ChatService();