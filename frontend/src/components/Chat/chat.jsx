import React, { useState, useEffect, useRef } from "react";
import CoolSidebar from "../sidebarHome/newSidebar";
import Navbar from "../navbarHome/NavbarHome";
import { FaPaperPlane, FaSmile, FaPaperclip, FaEllipsisH } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import ChatService from "../../services/ChatService"; // Ajustez le chemin
import axios from "axios";
import "./chat.css";

const Chat = () => {
    const [socket, setSocket] = useState(null);
    const [chatId, setChatId] = useState("");
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [senderId, setSenderId] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [error, setError] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const ADMIN_ID = "67bee9c72a104f8241d58e7d";

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Aucun token trouvé. Veuillez vous connecter.");
            window.location.href = "/login";
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            setSenderId(decodedToken.userId);
            setSocket(ChatService.initializeSocket());
            initializeChat(token, decodedToken.userId);
            ChatService.emitUserOnline(decodedToken.userId);
        } catch (error) {
            setError("Erreur lors du décodage du token : " + error.message);
            window.location.href = "/login";
        }

        return () => ChatService.disconnect();
    }, []);

    useEffect(() => {
        if (!socket || !chatId) return;

        ChatService.joinChat(chatId);

        const handleNewMessage = (message) => {
            console.log("Message reçu via Socket.io :", message); // Débogage
            if (message.chatId === chatId) {
                setMessages((prev) => [...prev, message]);
                scrollToBottomIfNeeded();
            }
        };

        const handleNewNotification = (notification) => {
            if (notification.recipientId === senderId) {
                setNotifications((prev) => [...prev, notification]);
            }
        };

        const handleTyping = (data) => {
            if (data.chatId === chatId && data.senderId !== senderId) {
                setTypingUser("Admin");
            }
        };

        const handleStopTyping = (data) => {
            if (data.chatId === chatId && data.senderId !== senderId) {
                setTypingUser(null);
            }
        };

        ChatService.on("newMessage", handleNewMessage);
        ChatService.on("newNotification", handleNewNotification);
        ChatService.on("userTyping", handleTyping);
        ChatService.on("userStoppedTyping", handleStopTyping);

        return () => {
            ChatService.off("newMessage", handleNewMessage);
            ChatService.off("newNotification", handleNewNotification);
            ChatService.off("userTyping", handleTyping);
            ChatService.off("userStoppedTyping", handleStopTyping);
        };
    }, [socket, chatId, senderId]);

    const initializeChat = async (token, userId) => {
        try {
            const chats = await ChatService.getUserChats();
            const existingChat = chats.find(chat =>
                chat.participants.some(p => p._id.toString() === userId) &&
                chat.participants.some(p => p._id.toString() === ADMIN_ID)
            );

            if (existingChat) {
                setChatId(existingChat._id);
                ChatService.joinChat(existingChat._id);
                const history = await ChatService.getChatHistory(existingChat._id);
                setMessages(history);
                scrollToBottom();
            } else {
                setError("No chat with the Admin at the moment. You can start writing.");
            }
        } catch (error) {
            setError(`Erreur lors de l'initialisation du chat : ${error.message}`);
            console.error("Erreur dans initializeChat:", error);
        }
    };

    const sendMessage = async () => {
        if (!messageInput || !senderId) {
            setError(" Please write a message message.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!chatId) {
                const response = await axios.post(
                    "http://localhost:5000/chat/message",
                    { content: messageInput },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const newChatId = response.data.chatId;
                setChatId(newChatId);
                ChatService.joinChat(newChatId);
            } else {
                ChatService.sendMessage(chatId, messageInput, senderId);
            }
            setMessageInput("");
            setError(null);
        } catch (error) {
            setError("Erreur lors de l'envoi du message : " + error.message);
            console.error("Erreur dans sendMessage:", error);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("chatId", chatId);
        formData.append("senderId", senderId);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5000/chat/upload",
                formData,
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
            );
            console.log("Réponse de l'upload :", response.data); // Débogage
            scrollToBottom();
        } catch (error) {
            setError("Erreur lors de l'upload du fichier : " + error.message);
            console.error("Erreur dans handleFileUpload:", error);
        }
    };

    const handleTyping = (e) => {
        setMessageInput(e.target.value);
        if (chatId && senderId) {
            ChatService.emitTyping(chatId, senderId, e.target.value.length > 0);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const scrollToBottomIfNeeded = () => {
        const container = messagesContainerRef.current;
        if (container) {
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
            if (isAtBottom) {
                scrollToBottom();
            }
        }
    };

    const emojis = ["😊", "😂", "😍", "👍", "😢", "😡", "✨", "🎉"];
    const addEmoji = (emoji) => {
        setMessageInput((prev) => prev + emoji);
        setShowEmojiPicker(false);
    };

    if (error && error !== "No chat with the Admin at the moment. You can start writing.") {
        return (
            <div className="chat-page">
                <CoolSidebar />
                <div className="chat-main">
                    <Navbar notifications={notifications} />
                    <div className="chat-container">
                        <p style={{ color: "red" }}>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-page">
            <CoolSidebar />
            <div className="chat-main">
                <Navbar notifications={notifications} />
                <div className="chat-container">
                    <div className="chat-header">
                        <h2>Chat with the Admin</h2>
                        <FaEllipsisH className="more-options" />
                    </div>
                    <div className="chat-messages" ref={messagesContainerRef}>
                        {messages.length === 0 && error && (
                            <p style={{ color: "gray", textAlign: "center" }}>{error}</p>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.sender === senderId ? "sent" : "received"}`}
                            >
                                <div className="message-content">
                                    <p>{msg.content}</p>
                                    {msg.fileUrl && (
                                        <div className="file-content">
                                            {msg.fileUrl.match(/\.(png|jpg|jpeg|jfif)$/i) ? (
                                                <img
                                                    src={`http://localhost:5000${msg.fileUrl}`}
                                                    alt="Fichier envoyé"
                                                    style={{ maxWidth: "200px", maxHeight: "200px" }}
                                                    onError={(e) => (e.target.style.display = "none")} // Cache si erreur de chargement
                                                />
                                            ) : msg.fileUrl.match(/\.pdf$/i) ? (
                                                <a
                                                    href={`http://localhost:5000${msg.fileUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: "#007bff", textDecoration: "underline" }}
                                                >
                                                    Voir le PDF
                                                </a>
                                            ) : (
                                                <a
                                                    href={`http://localhost:5000${msg.fileUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: "#007bff", textDecoration: "underline" }}
                                                >
                                                    Télécharger le fichier
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <span className="message-time">
                                        {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime())
                                            ? new Date(msg.timestamp).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "Heure indisponible"}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {typingUser && (
                            <div className="typing-indicator">
                                <p>{typingUser} est en train d'écrire...</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input">
                        <FaPaperclip
                            className="input-icon"
                            onClick={() => fileInputRef.current?.click()}
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            accept="image/png,image/jpeg,image/jpg,image/jfif,application/pdf" // Accepter images et PDF
                            onChange={handleFileUpload}
                        />
                        <input
                            type="text"
                            placeholder="Write a message..."
                            value={messageInput}
                            onChange={handleTyping}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <FaSmile
                            className="input-icon"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                        />
                        {showEmojiPicker && (
                            <div className="emoji-picker" style={{ position: "absolute", bottom: "60px", right: "20px" }}>
                                {emojis.map((emoji, index) => (
                                    <span
                                        key={index}
                                        style={{ fontSize: "24px", margin: "5px", cursor: "pointer" }}
                                        onClick={() => addEmoji(emoji)}
                                    >
                                        {emoji}
                                    </span>
                                ))}
                            </div>
                        )}
                        <button onClick={sendMessage}>
                            <FaPaperPlane />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;